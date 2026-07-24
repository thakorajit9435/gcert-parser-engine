from src.worker import celery_app

inspect = celery_app.control.inspect()

print("Active tasks:")
print(inspect.active())

print("\nReserved (queued) tasks:")
print(inspect.reserved())

print("\nScheduled tasks:")
print(inspect.scheduled())

print("\nRegistered tasks:")
print(inspect.registered())
