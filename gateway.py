"""
GATEWAY — main entry point
User yahan se file upload/download karega
Yeh hi replication aur quorum ka logic handle karta hai

Kaise chalao:
    python gateway.py
(Pehle teeno nodes chala lena: node_server.py 5001, 5002, 5003)
"""

from flask import Flask, request, jsonify
import requests
import time
import os
import hashlib
import metadata_store

app = Flask(__name__)

# Yahan apne 3 nodes ke addresses daalo
# Localhost pe test karte waqt yeh use karo, server pe deploy karte waqt
# inko actual server URLs se replace kar dena
import os

NODES = [
    os.environ["NODE_1_URL"],
    os.environ["NODE_2_URL"],
    os.environ["NODE_3_URL"],
]

WRITE_QUORUM = 2  # kam se kam itni copies confirm honi chahiye tabhi "success" bolenge


def calculate_checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@app.route("/upload", methods=["POST"])
def upload_file():
    """
    File leta hai user se, aur teeno nodes pe bhejta hai
    2/3 confirm hone tak wait karta hai (quorum)
    """
    if "file" not in request.files:
        return jsonify({"error": "file bhejo bhai"}), 400

    file = request.files["file"]
    file_id = request.form.get("file_id", file.filename)
    data = file.read()
    checksum = calculate_checksum(data)
    timestamp = time.time()

    confirmed_nodes = []

    # Teeno nodes ko file bhejo
    for node_url in NODES:
        try:
            response = requests.post(
                f"{node_url}/store",
                files={"file": (file_id, data)},
                data={"file_id": file_id},
                timeout=5
            )
            if response.status_code == 200:
                confirmed_nodes.append(node_url)
                print(f"[Gateway] {node_url} ne confirm kiya")
        except requests.exceptions.RequestException:
            print(f"[Gateway] {node_url} down hai ya nahi reach ho raha")

    # Quorum check
    if len(confirmed_nodes) >= WRITE_QUORUM:
        metadata_store.register_file(file_id, NODES, confirmed_nodes, checksum, timestamp)
        return jsonify({
            "status": "success",
            "message": f"File save ho gayi ({len(confirmed_nodes)}/{len(NODES)} copies confirm)",
            "file_id": file_id,
            "confirmed_nodes": confirmed_nodes
        }), 200
    else:
        return jsonify({
            "status": "failed",
            "message": f"Quorum nahi mila! Sirf {len(confirmed_nodes)}/{WRITE_QUORUM} confirm hue",
            "confirmed_nodes": confirmed_nodes
        }), 500


@app.route("/download/<file_id>", methods=["GET"])
def download_file(file_id):
    """
    Metadata check karta hai file kahan hai
    Fir jo bhi node available/healthy ho, wahan se file laata hai
    """
    file_info = metadata_store.get_file_info(file_id)
    if not file_info:
        return jsonify({"error": "file ka record nahi mila"}), 404

    # Har confirmed node try karo, jo pehle mil jaye wahan se de do
    for node_url in file_info["confirmed_nodes"]:
        try:
            response = requests.get(f"{node_url}/get/{file_id}", timeout=5)
            if response.status_code == 200:
                print(f"[Gateway] File {file_id} mili {node_url} se")
                return response.content, 200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Disposition": f"attachment; filename={file_id}"
                }
            elif response.status_code == 409:
                print(f"[Gateway] {node_url} pe file corrupt hai, agla node try karte hain")
        except requests.exceptions.RequestException:
            print(f"[Gateway] {node_url} down hai, agla try karte hain")

    return jsonify({"error": "koi bhi healthy copy nahi mili"}), 503


@app.route("/status", methods=["GET"])
def cluster_status():
    """Dashboard ke liye - poore cluster ka health dikhata hai"""
    node_status = {}
    for node_url in NODES:
        try:
            response = requests.get(f"{node_url}/health", timeout=3)
            node_status[node_url] = "UP" if response.status_code == 200 else "DOWN"
        except requests.exceptions.RequestException:
            node_status[node_url] = "DOWN"

    all_files = metadata_store.get_all_files()
    return jsonify({
        "nodes": node_status,
        "total_files": len(all_files),
        "files": all_files
    }), 200


if __name__ == "__main__":
    print("Starting Gateway on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=False)
