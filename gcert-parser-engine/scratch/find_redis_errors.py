import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)
keys = r.keys('celery-task-meta-*')

print(f"Found {len(keys)} task result metadata entries in Redis.")

for k in keys:
    val = r.get(k)
    data = json.loads(val)
    status = data.get('status')
    task_id = k.decode('utf-8').split('celery-task-meta-')[-1]
    
    # Try parsing dates or getting job_id if args/kwargs are stored
    print(f"\nTask ID: {task_id} | Status: {status}")
    if status == 'FAILURE':
        print(f"  Result/Exception: {data.get('result')}")
        print(f"  Traceback: {data.get('traceback')}")
    else:
        print(f"  Result: {str(data.get('result'))[:300]}")
