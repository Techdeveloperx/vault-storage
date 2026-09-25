# 🛡️ VAULT — Resilience OS

### Fault-Tolerant Distributed Object Storage System

VAULT is a fault-tolerant distributed object storage system designed to store, replicate, retrieve, and monitor data across multiple independent storage nodes.

The system is designed around **replication, quorum-based writes, node health monitoring, integrity verification, and resilient data retrieval**.

---

## 🚀 Project Overview

Traditional file storage can become unavailable when a single storage server fails.

VAULT addresses this problem by distributing files across multiple storage nodes.

When a file is uploaded:

1. The file reaches the Gateway.
2. The Gateway calculates its SHA-256 checksum.
3. The file is replicated across multiple storage nodes.
4. A **write quorum of 2/3 nodes** is required for successful storage.
5. Metadata is stored in PostgreSQL.
6. The dashboard continuously monitors the cluster.
7. Files can be retrieved from an available replica.

### Architecture

```text
                    ┌──────────────────────┐
                    │    VAULT FRONTEND    │
                    │   Resilience OS UI   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    API GATEWAY       │
                    │  Flask + Quorum      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │   NODE 01  │ │   NODE 02  │ │   NODE 03  │
        │   Storage  │ │   Storage  │ │   Storage  │
        └────────────┘ └────────────┘ └────────────┘
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL      │
                    │  Metadata Storage    │
                    └──────────────────────┘
