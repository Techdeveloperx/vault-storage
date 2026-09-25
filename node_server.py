"""
NODE SERVER — ek storage node ka code
Isi file ko alag-alag ports pe 3 baar chalao (Node1, Node2, Node3 banane ke liye)

Kaise chalao:
    python node_server.py 5001
    python node_server.py 5002
    python node_server.py 5003
"""

from flask import Flask, request, jsonify, send_file
import os
import sys
import hashlib
import time

app = Flask(__name__)

# Port command line se lenge (5001, 5002, 5003)
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
NODE_NAME = f"node_{PORT}"
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage", NODE_NAME)
os.makedirs(STORAGE_DIR, exist_ok=True)


def calculate_checksum(data: bytes) -> str:
    """File ka SHA-256 hash nikalta hai - corruption check ke liye"""
    return hashlib.sha256(data).hexdigest()


@app.route("/health", methods=["GET"])
def health():
    """Repair checker isko baar-baar call karega yeh check karne ke liye ki node zinda hai"""
    return jsonify({"status": "alive", "node": NODE_NAME}), 200


@app.route("/store", methods=["POST"])
def store_file():
    """
    File ko is node pe save karta hai
    Request mein file_id aur data (bytes) aana chahiye
    """
    file_id = request.form.get("file_id")
    if not file_id or "file" not in request.files:
        return jsonify({"error": "file_id ya file missing hai"}), 400

    file = request.files["file"]
    data = file.read()
    checksum = calculate_checksum(data)

    # File save karo
    file_path = os.path.join(STORAGE_DIR, file_id)
    with open(file_path, "wb") as f:
        f.write(data)

    # Checksum bhi save karo ek chhoti .checksum file mein
    with open(file_path + ".checksum", "w") as f:
        f.write(checksum)

    # Timestamp save karo (last-write-wins ke liye kaam aayega)
    with open(file_path + ".timestamp", "w") as f:
        f.write(str(time.time()))

    print(f"[{NODE_NAME}] Stored file: {file_id} | checksum: {checksum[:12]}...")
    return jsonify({
        "status": "stored",
        "node": NODE_NAME,
        "file_id": file_id,
        "checksum": checksum
    }), 200


@app.route("/get/<file_id>", methods=["GET"])
def get_file(file_id):
    """File wapas deta hai agar available ho"""
    file_path = os.path.join(STORAGE_DIR, file_id)

    if not os.path.exists(file_path):
        return jsonify({"error": "file nahi mili is node pe"}), 404

    # Corruption check - checksum verify karo read karne se pehle
    with open(file_path, "rb") as f:
        data = f.read()
    current_checksum = calculate_checksum(data)

    saved_checksum = None
    checksum_file = file_path + ".checksum"
    if os.path.exists(checksum_file):
        with open(checksum_file, "r") as f:
            saved_checksum = f.read().strip()

    if saved_checksum and current_checksum != saved_checksum:
        print(f"[{NODE_NAME}] CORRUPTION DETECTED for {file_id}!")
        return jsonify({"error": "file corrupt hai is node pe", "corrupted": True}), 409

    return send_file(file_path, as_attachment=True, download_name=file_id)


@app.route("/checksum/<file_id>", methods=["GET"])
def get_checksum(file_id):
    """Repair checker isse use karega yeh dekhne ke liye ki file sahi hai ya nahi, bina pura data download kiye"""
    file_path = os.path.join(STORAGE_DIR, file_id)
    checksum_file = file_path + ".checksum"

    if not os.path.exists(file_path) or not os.path.exists(checksum_file):
        return jsonify({"error": "not found"}), 404

    with open(file_path, "rb") as f:
        current_checksum = calculate_checksum(f.read())
    with open(checksum_file, "r") as f:
        saved_checksum = f.read().strip()

    return jsonify({
        "file_id": file_id,
        "checksum": current_checksum,
        "is_corrupted": current_checksum != saved_checksum
    }), 200


@app.route("/list", methods=["GET"])
def list_files():
    """Is node pe kaunsi files hain, sabki list"""
    files = [f for f in os.listdir(STORAGE_DIR) if not f.endswith(('.checksum', '.timestamp'))]
    return jsonify({"node": NODE_NAME, "files": files}), 200


@app.route("/delete/<file_id>", methods=["DELETE"])
def delete_file(file_id):
    """File delete karta hai (agar exist karti hai)"""
    file_path = os.path.join(STORAGE_DIR, file_id)
    deleted = False
    for suffix in ["", ".checksum", ".timestamp"]:
        p = file_path + suffix
        if os.path.exists(p):
            os.remove(p)
            deleted = True
    return jsonify({"deleted": deleted}), 200


if __name__ == "__main__":
    print(f"Starting {NODE_NAME} on port {PORT}...")
    print(f"Storage directory: {STORAGE_DIR}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
