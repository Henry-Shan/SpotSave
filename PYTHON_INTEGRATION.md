# Python Backend Integration Guide

## Architecture Overview

This app consists of two parts:
1. **Frontend + Coordination Backend** (this repo - Lovable/Supabase)
2. **Python Form Filler Service** (separate repository)

## Why Separate Services?

The Python code uses Selenium with Chrome/ChromeDriver, which:
- Requires browser automation (not supported in edge functions)
- Needs long-running processes
- Requires system-level dependencies

## Python Service Setup

### 1. Create a New Repository

Create a separate Git repository for your Python service with the Python code you provided.

### 2. Required Dependencies

```bash
pip install python-dotenv openai selenium webdriver-manager
```

### 3. Environment Variables

Create a `.env` file in your Python project:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
CHECK_FORMS_URL=https://your-project.supabase.co/functions/v1/check-pending-forms
UPDATE_STATUS_URL=https://your-project.supabase.co/functions/v1/update-form-status
```

### 4. Integration Script

Create `scheduler.py` to poll for pending forms:

```python
import time
import requests
from google_form_filler import fill_google_form
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

CHECK_FORMS_URL = os.getenv('CHECK_FORMS_URL')
UPDATE_STATUS_URL = os.getenv('UPDATE_STATUS_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def check_and_process_forms():
    """Check for pending forms and process them"""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Get pending forms
    response = requests.get(CHECK_FORMS_URL, headers=headers)
    data = response.json()
    
    if not data.get('success'):
        print(f"Error checking forms: {data.get('error')}")
        return
    
    pending_forms = data.get('pendingForms', [])
    print(f"Found {len(pending_forms)} forms to process")
    
    for form in pending_forms:
        form_id = form['id']
        form_url = form['form_url']
        
        try:
            print(f"Processing form: {form_url}")
            
            # Fill the form using your existing code
            fill_google_form(
                form_url=form_url,
                style="Be concise, friendly, and realistic. Answer as a Rice University student.",
                headless=True,
                auto_submit=True
            )
            
            # Update status to completed
            requests.post(
                UPDATE_STATUS_URL,
                headers=headers,
                json={'formId': form_id, 'status': 'completed'}
            )
            print(f"Successfully completed form {form_id}")
            
        except Exception as e:
            print(f"Error processing form {form_id}: {str(e)}")
            # Update status to failed
            requests.post(
                UPDATE_STATUS_URL,
                headers=headers,
                json={
                    'formId': form_id,
                    'status': 'failed',
                    'errorMessage': str(e)
                }
            )

def main():
    """Main loop - check every 60 seconds"""
    print("Starting form filler scheduler...")
    while True:
        try:
            check_and_process_forms()
        except Exception as e:
            print(f"Error in main loop: {str(e)}")
        
        # Wait 60 seconds before checking again
        time.sleep(60)

if __name__ == "__main__":
    main()
```

### 5. Run the Scheduler

```bash
python scheduler.py
```

## Deployment Options for Python Service

### Option 1: AWS EC2 / DigitalOcean Droplet
- Install Chrome/ChromeDriver
- Run as a systemd service
- Requires ~$5-10/month

### Option 2: Heroku with Chrome Buildpack
```bash
heroku create your-form-filler
heroku buildpacks:add heroku/python
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-google-chrome
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-chromedriver
git push heroku main
```

### Option 3: Google Cloud Run (Recommended)
- Build Docker image with Chrome
- Deploy as scheduled job
- Pay per execution

### Option 4: Local Development
- Run `python scheduler.py` on your local machine
- Keep it running 24/7 or use cron jobs

## Docker Setup (Recommended)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "scheduler.py"]
```

Build and run:
```bash
docker build -t form-filler .
docker run -d --env-file .env form-filler
```

## Security Notes

1. **Never commit .env files** - add to .gitignore
2. **Use service role key carefully** - only in backend Python service
3. **Validate all inputs** - check form URLs before processing
4. **Rate limiting** - add delays between form submissions
5. **Monitor logs** - watch for errors and failures

## Testing

1. Schedule a form in the web app
2. Check the database to confirm it's created
3. Wait for the scheduled time (or manually trigger)
4. Verify the Python service picks it up
5. Check the status updates in the dashboard

## Troubleshooting

**Forms not being processed:**
- Check Python service is running
- Verify environment variables are set
- Check edge function logs
- Ensure system time is correct

**Selenium errors:**
- Update ChromeDriver version
- Check Chrome is installed
- Try headless mode
- Add error logging

**Authentication issues:**
- Verify Supabase keys are correct
- Check RLS policies allow service role access
- Ensure edge functions are deployed
