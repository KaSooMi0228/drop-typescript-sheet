from jinja2 import Environment, FileSystemLoader, select_autoescape
import argparse
import json


parser = argparse.ArgumentParser()
parser.add_argument("input", type=open)
args = parser.parse_args()


def decode(raw):
    cache = {}

    def resolve(number):
        try:
            return cache[number]
        except KeyError:
            value = resolve_(number)
            cache[number] = value
            return value

    def resolve_(number):
        typ = raw[number]
        if type(typ) is int:
            return resolve(typ)[0], number + 1
        elif typ == "a":
            count = raw[number + 1]
            current = number + 2
            items = []
            for _ in range(count):
                item, next_index = resolve(current)
                current = next_index
                items.append(item)
            return (items, current)
        elif typ == "o":
            count = raw[number + 1]
            current = number + 2
            items = {}
            for _ in range(count):
                key, next_index = resolve(current)
                value, next_index = resolve(next_index)
                current = next_index
                items[key] = value
            return (items, current)
        elif typ == "v" or typ == "d" or typ == "$":
            return raw[number + 1], number + 2
        elif typ == "n":
            return None, number + 1
        elif typ == "?":
            return "?", number + 1
        elif typ == "f":
            return "function", number + 1
        else:
            assert False, typ

    return resolve(0)[0]


raw = json.load(args.input)
complete = []
for item in raw:
    if item["id"] == "reload":
        print(item)
        continue

    if "log" not in item:
        continue

    log = decode(item["log"])
    for entry in log:
        complete.append(
            {
                "date": entry["date"],
                "payload": entry["payload"],
                "kind": entry["kind"],
                "log": item["id"],
            }
        )

complete.sort(key=lambda x: x["date"])

env = Environment(loader=FileSystemLoader("."), autoescape=select_autoescape())


def keep(entry):
    if (
        entry["kind"] == "service-message"
        and entry["payload"]["type"] == "UPDATE_STATUS"
    ):
        return False
    if (
        entry["kind"] == "ACTION"
        and entry["payload"]["type"] == "SERVER_MESSAGE"
        and entry["payload"]["message"]["type"] == "UPDATE_STATUS"
    ):
        return False

    return True


def trace(thing, id, path):
    if thing == id:
        yield path
    if type(thing) is dict:
        for key, value in thing.items():
            path.append(key)
            yield from trace(value, id, path)
            path.pop()
    if type(thing) is list:
        for key, value in enumerate(thing):
            path.append(key)
            yield from trace(value, id, path)
            path.pop()


print("READY")
from bottle import route, run, template
import bottle

bottle.TEMPLATE_PATH = ["diagnose/views/"]


@route("/")
def index():
    return template("index", log=complete)


def find_interesting(index, direction):
    while True:
        index += direction
        if index < 0 or index >= len(complete):
            return None

        entry = complete[index]
        if entry["kind"] == "service-message":
            continue
        if (
            entry["kind"] == "ACTION"
            and entry["payload"]["type"] == "SERVER_MESSAGE"
            and entry["payload"]["message"]["type"] == "UPDATE_STATUS"
        ):
            continue
        if (
            entry["kind"] == "ACTION"
            and entry["payload"]["type"] == "VISIBILITY_CHANGE"
        ):
            continue
        if entry["kind"] == "cache-state":
            continue
        if entry["kind"] == "cache-action":
            continue
        if entry["kind"] == "STATE":
            continue

        if entry["kind"] == "SERVER_MESSAGE" and entry["payload"]["type"] == "TICK":
            continue

        return index


@route("/log/<index:int>")
def log_index(index):
    return template(
        "log_index",
        index=index,
        log=complete,
        interesting_previous=find_interesting(index, -1),
        interesting_next=find_interesting(index, 1),
        entry=complete[index],
        json=json.dumps(complete[index], indent=True),
    )


run(host="localhost", port=4545)

"""
for entry in complete:
    if (
        entry["kind"] == "SERVER_MESSAGE"
        and entry["payload"]["type"] == "ERROR"
        and entry["payload"]["status"] == "BAD_PATCH"
    ):
        patch_table = entry["payload"]["tableName"]
        patch_record = entry["payload"]["recordId"]
        patch_id = entry["payload"]["id"]
        print(
            "Bad Patch: ",
            entry["payload"]["tableName"],
            entry["payload"]["recordId"],
            entry["payload"]["id"],
        )

        for other in complete:
            if (
                other["kind"] == "CLIENT_MESSAGE"
                and "request" in other["payload"]["data"]
                and "type" in other["payload"]["data"]["request"]
                and other["payload"]["data"]["request"]["type"] == "PATCH"
                and other["payload"]["data"]["request"]["tableName"] == patch_table
                and other["payload"]["data"]["request"]["id"] == patch_record
            ):
                print("\tPATCH ", json.dumps(other, indent=True))

        for track in trace(complete, patch_record, []):
            item = complete[track[0]]
            print(track, item["kind"])

            if item["kind"] == "CLIENT_MESSAGE":
                data = item["payload"]["data"]
                if "request" in data:
                    print(item["payload"]["data"]["request"]["type"])
                else:
                    print(item["payload"]["data"]["type"])
            elif item["kind"] == "ACTION":
                print(item["payload"]["type"])
                if item["payload"]["type"] == "SERVER_MESSAGE":
                    print(item["payload"]["message"]["type"])
"""
