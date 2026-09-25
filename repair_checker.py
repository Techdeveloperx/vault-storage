"""
REPAIR CHECKER — background mein chalne wala watchdog
Yeh check karta rehta hai:
  1. Koi node down to nahi?
  2. Kisi file ki copies kam to nahi ho gayi?
  3. Koi file corrupt to nahi?
Aur agar problem mile, khud fix karta hai (missing node pe copy bana deta hai)

Kaise chalao (gateway aur nodes chalu hone ke baad, alag terminal mein):
    python repair_checker.py
"""

import requests
import time
import os
import metadata_store

NODES = [
    os.environ["NODE_1_URL"],
    os.environ["NODE_2_URL"],
    os.environ["NODE_3_URL"],
]

CHECK_INTERVAL_SECONDS = 10  # har 10 second mein check karega
REPLICATION_FACTOR = 2  # kam se kam itni healthy copies honi chahiye


def is_node_alive(node_url):
    try:
        response = requests.get(f"{node_url}/health", timeout=3)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def check_file_health(file_id, file_info):
    """
    Ek file ki saari copies check karta hai
    Return karta hai: (healthy_nodes list, missing_nodes list)
    """
    healthy_nodes = []
    missing_nodes = []

    for node_url in file_info["target_nodes"]:
        if not is_node_alive(node_url):
            missing_nodes.append(node_url)
            continue

        try:
            response = requests.get(f"{node_url}/checksum/{file_id}", timeout=5)
            if response.status_code == 200:
                result = response.json()
                if result.get("is_corrupted"):
                    print(f"  ⚠️  {node_url} pe {file_id} CORRUPT hai!")
                    missing_nodes.append(node_url)
                else:
                    healthy_nodes.append(node_url)
            else:
                missing_nodes.append(node_url)
        except requests.exceptions.RequestException:
            missing_nodes.append(node_url)

    return healthy_nodes, missing_nodes


def repair_file(file_id, healthy_nodes, missing_nodes):
    """
    Ek healthy copy se data leke, missing/corrupt node pe wapas daal deta hai
    """
    if not healthy_nodes:
        print(f"  ❌ {file_id} ke liye koi healthy copy nahi mili — repair NAHI ho sakta!")
        return healthy_nodes

    source_node = healthy_nodes[0]
    try:
        # Healthy node se file download karo
        response = requests.get(f"{source_node}/get/{file_id}", timeout=10)
        if response.status_code != 200:
            print(f"  ❌ {source_node} se {file_id} nahi mil payi repair ke liye")
            return healthy_nodes

        data = response.content

        # Jo bhi nodes zinda hain lekin file missing/corrupt hai, unpe wapas bhejo
        for target_node in missing_nodes:
            if is_node_alive(target_node):
                try:
                    requests.post(
                        f"{target_node}/store",
                        files={"file": (file_id, data)},
                        data={"file_id": file_id},
                        timeout=10
                    )
                    print(f"  ✅ {file_id} REPAIR ho gayi {target_node} pe (source: {source_node})")
                    healthy_nodes.append(target_node)
                except requests.exceptions.RequestException:
                    print(f"  ❌ {target_node} pe repair fail hui, node abhi bhi down lag raha hai")
    except requests.exceptions.RequestException:
        print(f"  ❌ Repair karte waqt error aaya")

    return healthy_nodes


def run_health_check():
    """Ek round ka health check + repair"""
    print(f"\n{'='*50}")
    print(f"Health check chal raha hai... [{time.strftime('%H:%M:%S')}]")
    print(f"{'='*50}")

    # Pehle nodes ka status dikhao
    for node_url in NODES:
        status = "🟢 UP" if is_node_alive(node_url) else "🔴 DOWN"
        print(f"  {node_url}: {status}")

    # Ab har file check karo
    all_files = metadata_store.get_all_files()
    if not all_files:
        print("  Koi files nahi hain abhi check karne ke liye")
        return

    for file_id, file_info in all_files.items():
        healthy, missing = check_file_health(file_id, file_info)
        print(f"\n  File: {file_id} — {len(healthy)} healthy, {len(missing)} missing/corrupt")

        if missing:
            # Kisi bhi target node pe copy missing/corrupt hai to use wapas banao,
            # taaki file hamesha apne poore replication factor (jaise 3/3) pe rahe.
            # Sirf "abhi kaam chal raha hai (2/3)" pe satisfy nahi hona hai —
            # warna agla node bhi fail hua to data hi kho sakta hai.
            print(f"  🔧 Repair zaroori hai! Repair kar rahe hain...")
            updated_healthy = repair_file(file_id, healthy, missing)
            metadata_store.update_confirmed_nodes(file_id, updated_healthy)
        else:
            print(f"  ✅ Sab thik hai, repair ki zaroorat nahi")


if __name__ == "__main__":
    print("Repair Checker shuru ho gaya hai... (Ctrl+C se rokho)")
    while True:
        run_health_check()
        time.sleep(CHECK_INTERVAL_SECONDS)
