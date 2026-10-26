---
layout: project
title: "Making ULI Agent-Ready: An MCP Server and a Voice Agent for Personal Loans"
role: AVP Engineering · RBIH
impact: Built an MCP server that lets AI agents find and call ULI's 160+ data service provider APIs, with every ULI credential kept behind one boundary. It is now the integration layer for a voice agent that takes a borrower through a personal loan application over a phone call.
timeline: "2026"
summary: Led RBIH's ULI MCP initiative from a read-only API catalog for AI assistants to guarded live identity and credit checks, which became the integration layer for a voice agent for personal loans.
---

## Background
The Unified Lending Interface (ULI) connects lenders with data service providers (DSPs) through one gateway: identity checks, credit bureaus, bank account and income data, land records, GST, e-sign and more. Its catalog has more than 160 of these APIs in seven categories.

Integrating them was slow, manual work. A lender's developer browsed a flat list of about 163 Swagger specs, read the categories on the docs site, and then pieced together OAuth2, AES-GCM credential encryption, IP and URL whitelisting, and each API's request and response shape from OpenAPI files as large as 390 KB. None of it was in a form an AI assistant could use.

Lenders and fintechs are starting to build AI agents for onboarding and servicing. For those agents to use ULI, ULI needs an interface they can understand and call, with the same controls a normal integration has. In June 2026 the CTO made the ULI MCP the highest-priority new initiative, with weekly progress reviews, and gave it to me.

## My Role
I own the initiative. I wrote the architecture decision record, built the MCP server and a reference identity agent myself, and set the security gates that decide when an agent is allowed to make a live call. I demoed the work to the CTO and ULI engineering leadership. When the voice loan journey started, I worked with the team building it so that its ULI calls went through the server.

## How It Came Together
- **June:** wrote ADR-001 and shipped the first version, a read-only discovery server. Deployed it on the office network the same month so colleagues could connect from their IDEs. Added the first live tool, bank account verification on the ULI sandbox, as a proof of concept the CTO asked for.
- **August and September:** added live PAN verification, using ULI's full encryption envelope and request signing, and then voter ID verification. Built the reference identity agent on top of them and demoed it with the server to the CTO and ULI engineering leadership.
- **October:** the CTO decided that every ULI integration in the new voice loan journey goes through the ULI MCP server. Within days the team had a personal loan journey working end to end over a phone call.

{% include figure.html src="/assets/img/uli-mcp/architecture.svg" alt="Architecture of the ULI MCP server. Three callers connect to it over MCP: developer IDEs such as Claude Code, VS Code and Cursor that ask what ULI can do, a reference identity agent limited to two tools, and a voice agent that runs a personal loan journey over a phone call. Inside the server, five read-only discovery tools (list categories, list services, get a service contract of at most 8 KB, how-to playbooks, OAuth2 auth flow) need no credentials, see no personal data and make no gateway calls. Four execution tools (bank account, PAN, credit bureau and voter ID verification) run against the ULI sandbox only and were added one at a time behind a security gate. All ULI credentials stay inside the server, and personal data is never written to logs. Execution tools send encrypted, signed requests to the ULI gateway (OAuth2, AES-GCM and RSA envelope, HMAC request signing), which routes them to data service providers: more than 160 APIs in seven categories." caption="One server sits between every agent and ULI. Discovery needs no credentials; live calls go through a small set of sandbox tools, and the credentials never leave the server." width=960 height=844 src_narrow="/assets/img/uli-mcp/architecture-narrow.svg" narrow_width=480 narrow_height=1372 %}

## Execution

### Phase 1: discovery with nothing to leak
- Scoped the work in two phases in ADR-001. Phase 1 only reads: it loads ULI's OpenAPI specs and a category taxonomy and answers questions about them. It makes no gateway calls, holds no credentials and sees no personal data. Phase 2, live calls, sits behind a separate security review.
- Built the server in Python with FastMCP, the official MCP Python SDK, with five read-only tools: list categories, list services, get one service's contract, a step-by-step "how to" playbook, and the OAuth2 flow. Asked how to run a credit eligibility check, the playbook returns the prerequisites, then the token call, then the API calls in order.
- Did not generate one tool per API. More than 160 tools would flood an agent's context. Instead the server condenses each spec into a short summary under a hard 8 KB limit and never returns raw YAML.
- Reconciled the catalog. The docs site, the Swagger list and the spec files disagreed (167, 163 and 171 entries). One taxonomy file is now the source of truth, and CI fails if an entry points to a missing spec or a new unlisted spec appears. Along the way I found and fixed an invalid YAML spec.
- Shipped it two ways: a local package for a developer's IDE, and a container with a stateless HTTP endpoint so a whole team shares one instance. Phase 1 closed with 93 tests.

### Phase 2: live calls, one tool at a time
- Added live tools one at a time instead of opening up the whole catalog: bank account verification first, then PAN, then credit bureau and voter ID checks. All of them run against the ULI sandbox only.
- Kept every ULI credential inside the MCP server. Credentials come from the environment, never from tool arguments, and are never logged. The personal data in a request (PAN, name, date of birth, account number) is never logged either.
- Kept the lender's signing key out of the server completely. For a PAN check, the lender signs the request with its own tool and the server only passes that signature on.
- Listed the known gaps in the project docs instead of hiding them, for example that the signature on PAN responses is not verified yet and that the six-hour ULI token needs automatic refresh.

### A reference agent built around its guardrails
- Built a small identity verification agent with Agno that calls the MCP server for PAN and voter ID checks. It has a typed API for a loan origination system and a chat interface. The agent loop is the easy part; the four controls around it are the point:
  - **Tool allowlist.** The agent sees exactly two of the server's tools, so a new live tool on the server never becomes callable by accident.
  - **Signature path guard.** The path to the applicant's PAN signature file is worked out in code from the validated request, never taken from model output, and is locked to one directory. Tests throw path traversal attempts at it.
  - **Identifier cross-check.** If the model tries to verify a PAN that is not the one in the request, the call is refused before it leaves the process. A wrong PAN sent to the tax department is a data incident, not something to retry.
  - **Redacted audit trail.** Every tool call writes a log line with no full PAN or voter ID, no date of birth, no name beyond an initial and no part of the signature.
- Turned retries off, because a retry can mean a second billable call to a data provider, and kept each applicant's history out of the next applicant's prompt.
- Wrote down where an agent does not belong. A single PAN check should be a plain function. The agent earns its place one level up, when several documents have names that do not match exactly and someone has to decide which checks to run and what the results mean together.
- CI runs the real agent loop against a stub MCP server and a scripted model, so the pipeline needs no ULI credentials and no model API key.

### The voice agent for personal loans
- The CTO set one rule for the new voice loan journey: any ULI integration goes through the ULI MCP server, and new integrations are added to the server instead of being built on the side.
- An RBIH engineering team built the voice agent on an Indian-language voice AI platform and connected it to the server. A borrower calls a phone number and completes a personal loan application by voice: phone number verification, PAN, credit bureau, Aadhaar and CKYC. A web view shows each application, its call transcript, a generated PDF and live progress through every stage.
- I worked with the team on the ULI side. I pointed them to ULI APIs, such as Aadhaar validation, that could be added to the server instead of mocked, shared the server setup, and tested the full journey to confirm it was ready to demo to leadership.

## Where It Stands
This is a working prototype on the ULI sandbox. It is not in production and there are no adoption numbers yet.
- Colleagues connect to a shared instance of the server from their IDEs, and the voice agent makes its ULI calls through the server.
- The voice journey works end to end with a mix of live ULI sandbox calls and mocks for services that are still waiting on access. Account aggregator support is in progress.
- Before any of this goes near a real lending decision, four things have to happen: the security ADR for live calls has to be accepted, the agent's final decision has to be derived in code from the provider response instead of written by the model, calls need idempotency keys, and stored provider responses need a retention job that follows the DPDP Act.

## Technologies & Tools

<div class="experience-tech">
  <div class="experience-tech-label">Technologies & Tools Used</div>
  <div class="experience-tech-list">
    <span class="tech-tag">Model Context Protocol (MCP)</span>
    <span class="tech-tag">FastMCP</span>
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Agno</span>
    <span class="tech-tag">AI Agents</span>
    <span class="tech-tag">Voice AI</span>
    <span class="tech-tag">OpenAPI</span>
    <span class="tech-tag">OAuth2</span>
    <span class="tech-tag">AES-GCM and RSA</span>
    <span class="tech-tag">Docker</span>
    <span class="tech-tag">pytest</span>
    <span class="tech-tag">GitHub Actions</span>
    <span class="tech-tag">DPDP Compliance</span>
  </div>
</div>
