"""
METADATA STORE — yeh "dimaag" hai system ka
Yeh track karta hai: kaunsi file kaunse nodes pe hai

Simple JSON file use kar rahe hain (koi database nahi chahiye)
"""

import json
import os
import threading

METADATA_FILE = os.path.join(os.path.dirname(__file__), "metadata.json")
_lock = threading.Lock()  # concurrent writes safe rakhne ke liye


def _load():
    if not os.path.exists(METADATA_FILE):
        return {}
    with open(METADATA_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _save(data):
    with open(METADATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def register_file(file_id: str, nodes: list, confirmed_nodes: list, checksum: str, timestamp: float):
    """
    Jab file upload hoti hai, iska record banate hain
    nodes = jahan bhejne ki koshish ki
    confirmed_nodes = jahan se success confirm hua
    """
    with _lock:
        data = _load()
        data[file_id] = {
            "target_nodes": nodes,
            "confirmed_nodes": confirmed_nodes,
            "checksum": checksum,
            "timestamp": timestamp,
            "replication_factor": len(nodes),
        }
        _save(data)


def get_file_info(file_id: str):
    """File ke baare mein sab info nikalo"""
    data = _load()
    return data.get(file_id)


def get_all_files():
    """Saari files ka record"""
    return _load()


def update_confirmed_nodes(file_id: str, confirmed_nodes: list):
    """Repair ke baad, update karo ki ab kaunse nodes pe file confirm hai"""
    with _lock:
        data = _load()
        if file_id in data:
            data[file_id]["confirmed_nodes"] = confirmed_nodes
            _save(data)


def delete_file_record(file_id: str):
    with _lock:
        data = _load()
        if file_id in data:
            del data[file_id]
            _save(data)
