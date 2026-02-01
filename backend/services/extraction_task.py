import asyncio
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class LogType(str, Enum):
    INFO = "info"
    PROGRESS = "progress"
    SUCCESS = "success"
    ERROR = "error"


@dataclass
class LogEntry:
    type: LogType
    message: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    progress: int | None = None

    def to_dict(self) -> dict:
        result = {
            "type": self.type.value,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
        }
        if self.progress is not None:
            result["progress"] = self.progress
        return result


@dataclass
class ExtractionTask:
    id: str
    campaign_id: str
    query: str
    lead_id: str | None = None
    lead_index: int | None = None
    status: TaskStatus = TaskStatus.PENDING
    logs: list[LogEntry] = field(default_factory=list)
    extraction_id: str | None = None
    error: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def add_log(
        self,
        message: str,
        log_type: LogType = LogType.INFO,
        progress: int | None = None,
    ) -> LogEntry:
        entry = LogEntry(type=log_type, message=message, progress=progress)
        self.logs.append(entry)
        return entry


# In-memory task storage
_tasks: dict[str, ExtractionTask] = {}
_task_events: dict[str, asyncio.Event] = {}
_task_subscribers: dict[str, list[asyncio.Queue]] = {}


def create_task(campaign_id: str, query: str) -> ExtractionTask:
    task_id = str(uuid.uuid4())[:8]
    task = ExtractionTask(id=task_id, campaign_id=campaign_id, query=query)
    _tasks[task_id] = task
    _task_events[task_id] = asyncio.Event()
    _task_subscribers[task_id] = []
    return task


def create_task_for_lead(
    campaign_id: str, query: str, lead_id: str, lead_index: int
) -> ExtractionTask:
    """Create extraction task for a specific lead with index for log prefixing."""
    task_id = str(uuid.uuid4())[:8]
    task = ExtractionTask(
        id=task_id,
        campaign_id=campaign_id,
        query=query,
        lead_id=lead_id,
        lead_index=lead_index,
    )
    _tasks[task_id] = task
    _task_events[task_id] = asyncio.Event()
    _task_subscribers[task_id] = []
    return task


def get_task(task_id: str) -> ExtractionTask | None:
    return _tasks.get(task_id)


async def subscribe_to_task(task_id: str) -> asyncio.Queue:
    if task_id not in _task_subscribers:
        _task_subscribers[task_id] = []
    queue: asyncio.Queue = asyncio.Queue()
    _task_subscribers[task_id].append(queue)

    # Send existing logs
    task = get_task(task_id)
    if task:
        for log in task.logs:
            await queue.put(("log", log.to_dict()))
        if task.status == TaskStatus.COMPLETED:
            await queue.put(("complete", {"extraction_id": task.extraction_id}))
        elif task.status == TaskStatus.FAILED:
            await queue.put(("error", {"message": task.error}))

    return queue


def unsubscribe_from_task(task_id: str, queue: asyncio.Queue) -> None:
    if task_id in _task_subscribers:
        try:
            _task_subscribers[task_id].remove(queue)
        except ValueError:
            pass


async def _notify_subscribers(task_id: str, event_type: str, data: dict) -> None:
    if task_id not in _task_subscribers:
        return
    for queue in _task_subscribers[task_id]:
        await queue.put((event_type, data))


async def add_log(
    task_id: str,
    message: str,
    log_type: LogType = LogType.INFO,
    progress: int | None = None,
) -> None:
    task = get_task(task_id)
    if not task:
        return
    entry = task.add_log(message, log_type, progress)
    await _notify_subscribers(task_id, "log", entry.to_dict())


async def complete_task(task_id: str, extraction_id: str) -> None:
    task = get_task(task_id)
    if not task:
        return
    task.status = TaskStatus.COMPLETED
    task.extraction_id = extraction_id
    await _notify_subscribers(task_id, "complete", {"extraction_id": extraction_id})


async def fail_task(task_id: str, error: str) -> None:
    task = get_task(task_id)
    if not task:
        return
    task.status = TaskStatus.FAILED
    task.error = error
    await _notify_subscribers(task_id, "error", {"message": error})


def set_task_running(task_id: str) -> None:
    task = get_task(task_id)
    if task:
        task.status = TaskStatus.RUNNING


def create_log_callback(task_id: str) -> Callable[[str, LogType, int | None], None]:
    def callback(
        message: str, log_type: LogType = LogType.INFO, progress: int | None = None
    ):
        asyncio.create_task(add_log(task_id, message, log_type, progress))

    return callback
