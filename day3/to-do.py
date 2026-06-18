import json
import os
import sys

FILE_NAME = "tasks.json"


def load_tasks():
    if os.path.exists(FILE_NAME):
        with open(FILE_NAME, "r") as file:
            return json.load(file)
    return []


def save_tasks(tasks):
    with open(FILE_NAME, "w") as file:
        json.dump(tasks, file, indent=4)


def add_task(task):
    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)
    print("Task added.")


def remove_task(index):
    tasks = load_tasks()

    if index < 1 or index > len(tasks):
        print("Invalid task number.")
        return

    removed = tasks.pop(index - 1)
    save_tasks(tasks)
    print(f"Removed: {removed}")


def list_tasks():
    tasks = load_tasks()

    if not tasks:
        print("No tasks found.")
        return

    for i, task in enumerate(tasks, start=1):
        print(f"{i}. {task}")


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("python todo.py add <task>")
        print("python todo.py remove <number>")
        print("python todo.py list")
        return

    command = sys.argv[1]

    if command == "add":
        task = " ".join(sys.argv[2:])
        add_task(task)

    elif command == "remove":
        try:
            remove_task(int(sys.argv[2]))
        except (IndexError, ValueError):
            print("Please provide a valid task number.")

    elif command == "list":
        list_tasks()

    else:
        print("Unknown command.")


if __name__ == "__main__":
    main()