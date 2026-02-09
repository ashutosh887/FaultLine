# FaultLine Integration Guide

How to integrate FaultLine into your AI agent system to get automated root-cause analysis.

---

## Quick Start

### 1. Install SDK

**Option A: Install from GitHub (Recommended)**

```bash
npm install github:ashutosh887/FaultLine#packages/sdk
```

**Option B: Install from npm (if published)**

```bash
npm install @faultline/sdk
```

**Option C: Install from local monorepo**

```bash
npm install ./packages/sdk
```

### 2. Initialize Tracer

```typescript
import { Tracer } from "@faultline/sdk";

const tracer = new Tracer({
  ingestUrl: "https://your-faultline-app.vercel.app", // Your deployed FaultLine URL
  // Optional: apiKey: "your-api-key" // If you add auth later
});
```

### 3. Emit Events

In your agent code, emit events at key points:

```typescript
// User input
tracer.emit({
  type: "user_input",
  payload: {
    text: "Book a flight from NYC to LAX for tomorrow",
  },
});

// Tool call
tracer.emit({
  type: "tool_call",
  payload: {
    tool_name: "flight_search",
    input: { origin: "NYC", destination: "LAX", date: "2026-02-05" },
    // Optional: error, latency_ms, output
  },
});

// Model output
tracer.emit({
  type: "model_output",
  payload: {
    text: "Found 3 flights. The best option is Flight AA123...",
    token_count: 52,
  },
});

// Memory operations
tracer.emit({
  type: "memory_op",
  payload: {
    operation: "store",
    key: "user_preferences",
    value: { preferred_airline: "AA" },
  },
});
```

---

## Event Types

FaultLine supports these event types:

### `user_input`

Captures user requests/inputs.

```typescript
tracer.emit({
  type: "user_input",
  payload: {
    text: string,
    // Optional: metadata, session_id, user_id
  },
});
```

### `tool_call`

Captures tool/function calls.

```typescript
tracer.emit({
  type: "tool_call",
  payload: {
    tool_name: string,
    input: object,
    output?: object,        // If successful
    error?: string,         // If failed
    latency_ms?: number,     // Execution time
  }
});
```

### `model_output`

Captures LLM responses.

```typescript
tracer.emit({
  type: "model_output",
  payload: {
    text: string,
    token_count?: number,
    model?: string,
    // Optional: reasoning, citations
  }
});
```

### `memory_op`

Captures memory operations.

```typescript
tracer.emit({
  type: "memory_op",
  payload: {
    operation: "store" | "retrieve" | "delete",
    key: string,
    value?: unknown,
  }
});
```

### `system_state`

Captures system state changes.

```typescript
tracer.emit({
  type: "system_state",
  payload: {
    state: object,
    reason?: string,
  }
});
```

---

## Integration Examples

### Example 1: LangChain Agent

```typescript
import { Tracer } from "@faultline/sdk";
import { AgentExecutor } from "langchain/agents";

const tracer = new Tracer({
  ingestUrl: process.env.FAULTLINE_URL!
});

// Wrap your agent execution
async function runAgent(userInput: string) {
  const traceId = tracer.getTraceId();

  tracer.emit({
    type: "user_input",
    payload: { text: userInput }
  });

  try {
    const executor = new AgentExecutor({...});

    // Before tool call
    tracer.emit({
      type: "tool_call",
      payload: {
        tool_name: "search_flights",
        input: { query: userInput }
      }
    });

    const result = await executor.invoke({ input: userInput });

    // After success
    tracer.emit({
      type: "model_output",
      payload: {
        text: result.output,
        token_count: result.tokenUsage?.totalTokens
      }
    });

    return result;
  } catch (error) {
    // On error
    tracer.emit({
      type: "tool_call",
      payload: {
        tool_name: "agent_execution",
        error: String(error),
        input: { input: userInput }
      }
    });
    throw error;
  }
}
```

### Example 2: OpenAI Function Calling

```typescript
import { Tracer } from "@faultline/sdk";
import OpenAI from "openai";

const tracer = new Tracer({
  ingestUrl: process.env.FAULTLINE_URL!,
});

const openai = new OpenAI();

async function chatWithFunctions(messages: any[]) {
  tracer.emit({
    type: "user_input",
    payload: { text: messages[messages.length - 1].content },
  });

  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "book_flight",
          // ...
        },
      },
    ],
  });

  tracer.emit({
    type: "model_output",
    payload: {
      text: response.choices[0].message.content,
      token_count: response.usage?.total_tokens,
    },
  });

  // If function is called
  if (response.choices[0].message.tool_calls) {
    for (const toolCall of response.choices[0].message.tool_calls) {
      tracer.emit({
        type: "tool_call",
        payload: {
          tool_name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
          latency_ms: Date.now() - startTime,
        },
      });
    }
  }

  return response;
}
```

### Example 3: Custom Agent Framework

```typescript
import { Tracer } from "@faultline/sdk";

class MyAgent {
  private tracer: Tracer;

  constructor(faultlineUrl: string) {
    this.tracer = new Tracer({ ingestUrl: faultlineUrl });
  }

  async process(userRequest: string) {
    // Start trace
    this.tracer.emit({
      type: "user_input",
      payload: { text: userRequest },
    });

    // Step 1: Parse request
    const parsed = this.parseRequest(userRequest);

    // Step 2: Call tools
    for (const tool of parsed.tools) {
      const startTime = Date.now();

      try {
        const result = await this.callTool(tool);

        this.tracer.emit({
          type: "tool_call",
          payload: {
            tool_name: tool.name,
            input: tool.input,
            output: result,
            latency_ms: Date.now() - startTime,
          },
        });
      } catch (error) {
        this.tracer.emit({
          type: "tool_call",
          payload: {
            tool_name: tool.name,
            input: tool.input,
            error: String(error),
            latency_ms: Date.now() - startTime,
          },
        });
        throw error;
      }
    }

    // Step 3: Generate response
    const response = await this.generateResponse(parsed);

    this.tracer.emit({
      type: "model_output",
      payload: {
        text: response,
        token_count: this.countTokens(response),
      },
    });

    return response;
  }
}
```

---

## Advanced Usage

### Batch Events

For high-throughput systems, use batch mode:

```typescript
const tracer = new Tracer({
  ingestUrl: "https://your-app.vercel.app",
  batch: true,
  flushIntervalMs: 5000 // Flush every 5 seconds
});

// Events are buffered and sent in batches
tracer.emit({ type: "user_input", payload: {...} });
tracer.emit({ type: "tool_call", payload: {...} });
// ... more events

// Manually flush when done
await tracer.flush();
```

### Trace Context Propagation

For distributed systems:

```typescript
// Parent trace
const parentContext = tracer.getTraceId();

// Pass to child service
const childContext = tracer.childContext();

// Child service uses childContext
// Events are linked to parent trace
```

### Custom Trace IDs

```typescript
// Use your own trace ID
const customTraceId = "my-custom-trace-123";

const tracer = new Tracer(
  {
    ingestUrl: "...",
  },
  {
    trace_id: customTraceId,
  },
);
```

---

## API Integration (Without SDK)

If you can't use the SDK, use the REST API directly:

### Ingest Events

```bash
curl -X POST https://your-app.vercel.app/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "optional-trace-id",
    "events": [
      {
        "type": "user_input",
        "payload": { "text": "Book a flight..." },
        "timestamp": "2026-02-09T10:00:00Z"
      },
      {
        "type": "tool_call",
        "payload": {
          "tool_name": "flight_search",
          "input": { "origin": "NYC", "destination": "LAX" }
        },
        "timestamp": "2026-02-09T10:00:01Z"
      }
    ]
  }'
```

### Get Reports

```bash
# List all runs
curl https://your-app.vercel.app/api/runs

# Get specific report
curl https://your-app.vercel.app/api/runs/{trace_id}/report
```

---

## Environment Variables

Set these in your agent application:

```bash
FAULTLINE_URL=https://your-faultline-app.vercel.app
# Optional: FAULTLINE_API_KEY=your-api-key
```

---

## Best Practices

### 1. Emit Events at Key Points

- **User input**: When user sends request
- **Tool calls**: Before and after tool execution
- **Model outputs**: After LLM generates response
- **Errors**: When any step fails

### 2. Include Context

```typescript
tracer.emit({
  type: "tool_call",
  payload: {
    tool_name: "flight_search",
    input: { origin: "NYC", destination: "LAX", date: "2026-02-05" },
    latency_ms: 1200, // Include timing
    error: "Invalid date format", // Include errors
  },
});
```

### 3. Use Consistent Trace IDs

```typescript
// For a single user session
const traceId = tracer.getTraceId();

// Use same traceId for all events in that session
// This groups related events together
```

### 4. Handle Errors Gracefully

```typescript
try {
  tracer.emit({ type: "tool_call", payload: {...} });
  const result = await callTool();
  tracer.emit({ type: "tool_call", payload: { output: result } });
} catch (error) {
  tracer.emit({
    type: "tool_call",
    payload: { error: String(error) }
  });
  throw error;
}
```

---

## What Happens After Integration

1. **Events are ingested** → Stored in Redis
2. **Job is enqueued** → BullMQ queue (`faultline-forensics`)
3. **Worker processes** → Gemini analyzes the trace
4. **Report is generated** → Verdict + causal graph stored
5. **View in UI** → Visit `/runs/{trace_id}` to see analysis

**Analysis typically takes 10-30 seconds** depending on trace length.

---

## Troubleshooting

### Events Not Appearing

- Check `FAULTLINE_URL` is correct
- Verify network connectivity to your FaultLine instance
- Check browser console / server logs for errors

### Analysis Not Running

- Verify worker is running (check Koyeb logs)
- Check `GEMINI_API_KEY` is set in worker
- Verify Redis connection

### High Latency

- Use batch mode for high-throughput systems
- Events are sent asynchronously (non-blocking)

---

## Next Steps

1. **Deploy FaultLine**: See `DEPLOYMENT.md`
2. **Integrate SDK**: Add tracer to your agent code
3. **Test**: Send a few test traces
4. **View Results**: Check `/runs` page for analysis

**Questions?** Check `README.md` or open an issue on GitHub.
