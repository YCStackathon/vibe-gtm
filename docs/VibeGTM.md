**Reducto**  
HACKTHESTACKATHON - firecrawl bonus code  
[reducto.ai/hackathon](http://reducto.ai/hackathon) - signed up  
Supabase - student plan

**What is GTM:**

1. Find leads  
2. Enrich leads  
3. Operations (connect on LI, send email, drop voicemail, etc.)

We limit to Enriching leads to meet the requirement:

> Thoughtful tradeoffs  
> Clear decisions about scope, architecture, and constraints. Tell us what you  
chose not to do and why.

**What do we do?**

* Based on  
  * Input list of ppl  
  * Info about you  
    * Also scrapped  
      * Linkedin  
      * Instagram  
      * Facebook  
      * Human in the loop: “Hey, I also like motorcycling.”

**Initial Demo plan:**

* GTM is difficult, and there is no simple solution  
* It is manual  
* We interviewed 10+ ppl (established companies, YC Startups, and mid-size companies)  
* Everyone needs something else and does things differently  
* The only thing in common is lead enrichment/hacking  
  * What do we have in common?  
  * What could be an entry?  
* We are solving this problem ourselves, building GTM for Paradigm.  
* 

## DEMO

### **Part 1: The Demo Narrative (3 Minutes)**

**1. The Hook: "I Fired My VAs" (0:00 - 0:45)**

* **Speaker (Maks):** "I used to run a dev shop. To get leads, I hired an army of Virtual Assistants to scour the web, read blog posts, and find one personal thing to mention. It was slow and expensive."  
* **The Shift:** "Now, we are building **Paradigm** (a dev tool). We came to SF to find Design Partners. We assumed we should just blast emails. But we validated our GTM with experts like **Zac (ex-Turing)**, **Bart (SkyEngine AI Series A)**, and **YCombinator founders Niosha & Wojtek**."  
* **The Insight:** "They all said the same thing: **Don't find more leads. Enrich the ones you have.** If you can't find a *technical* fit (do they use Cursor?) and a *personal* fit (do we have a shared hobby?), don't send the email."

**2. The Setup: "Building the Mirror" (0:45 - 1:30)**

* **Visual:** A simple dashboard/terminal.  
* **Narrative:** "To find a match, the Agent first needs to know who *we* are. We call this 'Identity Injection'."  
* **Action (Reducto):** "We drop in our **PDF CVs** and the **Hackathon Instructions PDF** (which lists the judges)."  
* **Action (Firecrawl):** "The Agent also **Firecrawls** our own X.com and Instagram profiles."  
* **Result:** "It builds a JSON profile: *Maks likes Kick Boxing, Muay Thai & Motorcycles. Kuba likes tennis, aviation & Motocycles. Paradigm targets Series A startups using Cursor/Windsurf and have codebases that are larger than 100k lines.*"

**3. The Work: "The Paradigm Hunt" (1:30 - 2:15)**

* **Visual:** A purchased CSV of "Series A SF Founders" (The Paradigm List).  
* **Action (Pre-recorded Fast Forward):** The Agent running on the list.  
* **Visual (Terminal Logs):**  
  * [Firecrawl] Scanning acme.com/jobs -> Found "Experience with Cursor/Windsurf"  
  * [Firecrawl] Scanning founder_blog.com -> Found post about "Training in Thailand"  
  * [Matchmaker] MATCH FOUND: Tech Stack (Cursor) + Vibe (Muay Thai).  
* **Narrative:** "It filters out the noise. It only flags companies that technically match our stack and culturally match our vibe."

**4. The Surprise: "The Judge Hook" (2:15 - 3:00)**

* **Speaker:** "We ran this same engine on the **Hackathon Judge List** we ingested earlier."  
* **The Reveal:** Look directly at a specific judge (e.g., Nicolas Dessaigne or Caleb Peffer).  
* **Live Line:** *"For example, Caleb (Firecrawl CEO), our agent scanned your recent activity and compared it to mine. It drafted this: 'Hey Caleb, love what you're doing with Firecrawl... I saw you're also into [Real Hobby found via Firecrawl]. It would be great to [Activity] together sometime.'"*  
* **The Close:** "We automated the 'Human Touch.' We use Firecrawl for the deep dive, Reducto for the context, and Resend to deliver the briefing."

QnA:

* The human touch is what makes a night and day difference: Real life example - week of cold/warm emailing/calling - none, sending a beer mug with a company logo - hey, let's talk.

Product:

* Input: pfd, list of ppl  
* Output: special connections with prospects + proposed actions (email using reducto)

Spec:

* I want it to have sessions that are all visible for all users, so everyone can see each other work, just for simplicity  
  * I want them to be selectable on the left sidebar like in any chat application

Challenges:

* Firecrawl hallucination/bias  
  * Post about founders playing padel, YC partner mentioned - he does not play padel