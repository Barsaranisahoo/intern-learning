
from __future__ import annotations

import argparse
import random
from datetime import datetime
from typing import List, Tuple


QUOTES: List[Tuple[str, str]] = [
	("The only way to do great work is to love what you do.", "Steve Jobs"),
	("You miss 100% of the shots you don't take.", "Wayne Gretzky"),
	("Whether you think you can or you think you can't, you're right.", "Henry Ford"),
	("Act as if what you do makes a difference. It does.", "William James"),
	("Success is not final, failure is not fatal: It is the courage to continue that counts.", "Winston Churchill"),
]


def format_date(dt: datetime) -> str:
	return dt.strftime("%A, %B %d, %Y %H:%M:%S")


def print_header() -> None:
	now = datetime.now()
	print(f"Today: {format_date(now)}")


def list_quotes() -> None:
	print("\nAvailable quotes:")
	for i, (q, a) in enumerate(QUOTES, start=1):
		print(f"  {i}. {q} — {a}")


def get_quote_by_choice(index: int) -> Tuple[str, str]:
	if 1 <= index <= len(QUOTES):
		return QUOTES[index - 1]
	raise IndexError("Choice out of range")


def main() -> None:
	parser = argparse.ArgumentParser(description="Print the current date and a motivational quote.")
	group = parser.add_mutually_exclusive_group()
	group.add_argument("--random", "-r", action="store_true", help="Pick a random quote")
	group.add_argument("--choice", "-c", type=int, help="Pick a quote by its 1-based index")
	args = parser.parse_args()

	print_header()

	if args.random:
		q, a = random.choice(QUOTES)
		print(f"\n{q}\n— {a}")
		return

	if args.choice is not None:
		try:
			q, a = get_quote_by_choice(args.choice)
			print(f"\n{q}\n— {a}")
		except IndexError:
			print(f"Invalid choice: {args.choice}. Use --choice between 1 and {len(QUOTES)}")
		return

	# Interactive mode
	list_quotes()
	print("\nEnter a number to select a quote, 'r' for random, or Enter to pick 1:", end=" ")
	try:
		choice = input().strip()
	except (EOFError, KeyboardInterrupt):
		print("\nNo selection made. Exiting.")
		return

	if choice.lower() == "r":
		q, a = random.choice(QUOTES)
	elif choice == "":
		q, a = QUOTES[0]
	else:
		try:
			idx = int(choice)
			q, a = get_quote_by_choice(idx)
		except Exception:
			print(f"Invalid input '{choice}'. Picking a random quote.")
			q, a = random.choice(QUOTES)

	print(f"\n{q}\n— {a}")


if __name__ == "__main__":
	main()

