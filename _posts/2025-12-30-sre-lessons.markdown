---
layout: post
title: "SRE & Security Lessons from the 2025 Trenches"
date: 2025-12-30 00:00:00 +0100
categories: cloud security sre ai devops distributed-systems
---

If you look back at the engineering landscape of 2025, it wasn't just another year of iteration. It was a phase shift. We saw a collision between two massive tectonic forces: the chaotic complexity of hyperscale systems and the ungoverned integration of AI agents.

Here is the thing. We have better observability and automation tools than ever before. Yet, the systemic fragility of our infrastructure has never been more acute. I've spent the last few weeks digging through the 2025 State of DevOps reports, RCAs from AWS and Google, and the Catchpoint SRE survey. The data paints a picture of a "Configuration Cascade" replacing hardware failure as our main antagonist.

We need to talk about what actually broke, why our zonal redundancy was an illusion, and the specific code patterns we need to survive the second half of the Cloud Native era.

## The Anatomy of a Hyperscale Crash

The biggest lesson from 2025 is that the promise of "global control planes" has become our greatest liability. We optimized for velocity, building pipelines that push config to thousands of nodes in seconds. But when that config is malformed, the speed of propagation becomes the speed of destruction.

### 1. The AWS DNS Race Condition

On October 20, 2025, us-east-1 went dark. It wasn't a cyberattack. It was a concurrency bug in the DynamoDB internal DNS system.

Here is what happened. The system has a "Planner" that makes a DNS plan and an "Enactor" that applies it. They run redundant Enactors for safety. But they hit a race condition. One Enactor lagged, held a "stale" plan, and then woke up to overwrite the "fresh" plan from a healthy Enactor.

Because they lacked a robust optimistic locking mechanism at the write commit point, the stale data won. The cleanup workflow saw this inconsistent state, assumed no valid endpoints existed, and deleted the DNS records.

The kick in the teeth? The recovery tools depended on the very system (DynamoDB) that was down.

**The Takeaway:** If your ability to fix the network depends on the network being up, you have designed a fragility trap.

### 2. The "Safe" Change that Broke Google

Months earlier, GCP took a hit from a null pointer exception. A code change for a new policy feature was deployed behind a feature flag. Safe, right? Except the configuration update that enabled it contained unintended blank fields.

This config was pushed globally to ensure financial controls were enforced in real-time. The binary read the null value, crashed, and because it sits in the critical path of every API request, global traffic tanked.

**The Takeaway:** Configuration is code. We canary binaries, but we often blast configuration changes globally. A "canary config" push would have caught this in one region.

## Identity is the New Edge (and it's Leaking)

While SREs were fighting race conditions, security teams were dealing with a shift from perimeter defense to identity defense. The firewall is dead. The Identity Provider is the new edge.

### The Salesloft/Drift Breach

The breach of Salesloft's Drift platform didn't involve a zero-day or a phished password. It was an OAuth token exfiltration. Attackers stole valid tokens and "became" the application. Since they had bearer access, MFA didn't matter. They accessed Salesforce environments via API, bypassing the UI entirely.

Most defenses failed because they looked for login events. API calls don't generate login events. The only thing that worked was IP restrictions on Connected Apps.

### PromptLock: Ransomware with a Brain

We also saw "PromptLock." This ransomware doesn't have hardcoded encryption logic. It carries a local LLM (like gpt-oss:20b) and asks it to write encryption scripts in Lua dynamically at runtime. Every execution is different. It is polymorphic by design, rendering signature-based detection useless.

## The Code: Fighting Back

Philosophy is great, but let's look at the Python patterns that prevent these specific failures.

### 1. Distributed Locking (The AWS Fix)

The AWS outage proved in-memory locks don't work in distributed systems. You need a distributed lock with a fencing token or lease. Here is a robust implementation using Redis that handles the "Zombie Release" problem (where a process wakes up and deletes a lock it no longer owns).

```python
import time
import uuid
import redis

class RedisDistributedLock:
    def __init__(self, redis_client, lock_key, lease_time_ms=10000):
        self.redis = redis_client
        self.lock_key = lock_key
        self.lease_time_ms = lease_time_ms
        # Unique ID for this specific process instance is CRITICAL
        self.owner_id = str(uuid.uuid4())

    def acquire(self, wait_time_ms=5000):
        end_time = (time.time() * 1000) + wait_time_ms
        while (time.time() * 1000) < end_time:
            # NX: Set only if not exists (Atomic)
            # PX: Set expiration in milliseconds (Lease)
            if self.redis.set(self.lock_key, self.owner_id, nx=True, px=self.lease_time_ms):
                return True
            time.sleep(0.1)  # Retry backoff
        return False

    def release(self):
        # LUA Script to ensure atomicity:
        # "Check if I own the lock. If yes, delete it. If no, do nothing."
        # This prevents the "Zombie Release" problem.
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        self.redis.eval(lua_script, 1, self.lock_key, self.owner_id)
```

### 2. The Circuit Breaker (The Cascading Failure Fix)

To stop the bleeding when a dependency like GCP's Service Control fails, you need a circuit breaker. Stop retrying. Fail fast.

```python
import time
from botocore.exceptions import ClientError, BotoCoreError

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.state = "CLOSED"
        self.last_failure_time = 0

    def call(self, func, *args, **kwargs):
        # If circuit is OPEN, check if we should try a reset (Half-Open)
        if self.state == "OPEN":
            if (time.time() - self.last_failure_time) > self.recovery_timeout:
                self.state = "HALF_OPEN"   # Probation period
            else:
                raise Exception("Circuit is OPEN. Call rejected fast.")
        
        try:
            result = func(*args, **kwargs)
            # If successful in Half-Open, reset to Closed
            if self.state == "HALF_OPEN":
                self.reset()
            return result
        except (ClientError, BotoCoreError) as e:
            self.record_failure()
            raise e

    def record_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = "OPEN"
            print(f"Circuit Breaker tripped! State is now OPEN.")

    def reset(self):
        self.failures = 0
        self.state = "CLOSED"
        print("Circuit recovered. State is CLOSED.")
```

## The Path Forward

We are entering an era of interconnected fragility. We are abstracting away infrastructure with Serverless and AI Agents, but we are introducing invisible layers of logical dependency.

The SRE of 2026 isn't just a Linux sysadmin. They are a distributed systems theorist who understands Paxos to prevent race conditions. They are an Identity Architect who treats OAuth tokens like nuclear launch codes. And they are an AI Guardian who builds cages for models.

We have to stop trusting global control planes. We have to stop trusting internal traffic. And honestly, we have to stop trusting AI code blindly.

Read the full post on Medium [here](https://pulse.rajatgupta.work/sre-security-lessons-from-the-2025-trenches-8ea01b0c03a8).
