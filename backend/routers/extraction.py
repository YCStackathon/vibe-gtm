import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.extraction_task import (
    TaskStatus,
    get_task,
    subscribe_to_task,
    unsubscribe_from_task,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/extraction", tags=["extraction"])


@router.get("/{task_id}/status")
async def get_extraction_status(task_id: str):
    """Get the current status of an extraction task."""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": task.id,
        "campaign_id": task.campaign_id,
        "query": task.query,
        "status": task.status.value,
        "extraction_id": task.extraction_id,
        "error": task.error,
        "log_count": len(task.logs),
    }


@router.get("/{task_id}/stream")
async def stream_extraction_logs(task_id: str):
    """Stream extraction logs via Server-Sent Events."""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        queue = await subscribe_to_task(task_id)
        try:
            while True:
                try:
                    event_type, data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

                    if event_type in ("complete", "error"):
                        break
                except TimeoutError:
                    yield "event: ping\ndata: {}\n\n"

                # Check if task is done
                current_task = get_task(task_id)
                done_statuses = (TaskStatus.COMPLETED, TaskStatus.FAILED)
                if current_task and current_task.status in done_statuses:
                    if queue.empty():
                        break
        finally:
            unsubscribe_from_task(task_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
