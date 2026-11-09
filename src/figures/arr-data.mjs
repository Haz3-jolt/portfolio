// What lives in each drawer of the ARR cabinet: the kind of resource, the standard it follows, and
// real, public resources of that kind (all checked on GitHub, Nov 2026). The skills drawer holds
// Hari's favourites. Every folder links out. Edit this file to change what's in the cabinet.
const gh = (path) => `https://github.com/${path}`;

export const DRAWERS = [
  {
    label: "skills",
    title: "Skills",
    standard: { name: "agentskills.io", href: "https://agentskills.io" },
    cards: [
      { name: "impeccable", from: "pbakaus/impeccable", href: gh("pbakaus/impeccable") },
      { name: "taste-skill", from: "Leonxlnx/taste-skill", href: gh("Leonxlnx/taste-skill") },
      { name: "ponytail", from: "DietrichGebert/ponytail", href: gh("DietrichGebert/ponytail") },
      { name: "anatomy", from: "wheresryan22/anatomy", href: gh("wheresryan22/anatomy") },
      { name: "frontend-design", from: "anthropics/skills", href: gh("anthropics/skills/tree/main/skills/frontend-design") },
      { name: "skill-creator", from: "anthropics/skills", href: gh("anthropics/skills/tree/main/skills/skill-creator") },
    ],
  },
  {
    label: "mcp",
    title: "MCP servers",
    standard: { name: "modelcontextprotocol.io", href: "https://modelcontextprotocol.io" },
    cards: [
      { name: "GitHub", from: "github/github-mcp-server", href: gh("github/github-mcp-server") },
      { name: "Playwright", from: "microsoft/playwright-mcp", href: gh("microsoft/playwright-mcp") },
      { name: "Context7", from: "upstash/context7", href: gh("upstash/context7") },
      { name: "Sentry", from: "getsentry/sentry-mcp", href: gh("getsentry/sentry-mcp") },
      { name: "Filesystem", from: "modelcontextprotocol/servers", href: gh("modelcontextprotocol/servers/tree/main/src/filesystem") },
      { name: "Fetch", from: "modelcontextprotocol/servers", href: gh("modelcontextprotocol/servers/tree/main/src/fetch") },
    ],
  },
  {
    label: "hooks",
    title: "Hooks",
    standard: { name: "Claude Code hooks", href: "https://code.claude.com/docs/en/hooks" },
    cards: [
      { name: "Hooks mastery", from: "disler/claude-code-hooks-mastery", href: gh("disler/claude-code-hooks-mastery") },
      { name: "Multi-agent observability", from: "disler/claude-code-hooks-multi-agent-observability", href: gh("disler/claude-code-hooks-multi-agent-observability") },
      { name: "Continuous Claude", from: "parcadei/Continuous-Claude-v3", href: gh("parcadei/Continuous-Claude-v3") },
      { name: "Safety hooks", from: "karanb192/claude-code-hooks", href: gh("karanb192/claude-code-hooks") },
      { name: "Hook recipes", from: "shanraisshan/claude-code-hooks", href: gh("shanraisshan/claude-code-hooks") },
    ],
  },
  {
    label: "prompts",
    title: "Prompts",
    standard: { name: "Prompt engineering guide", href: "https://www.promptingguide.ai" },
    cards: [
      { name: "Awesome prompts", from: "f/awesome-chatgpt-prompts", href: gh("f/awesome-chatgpt-prompts") },
      { name: "Prompt Engineering Guide", from: "dair-ai/Prompt-Engineering-Guide", href: gh("dair-ai/Prompt-Engineering-Guide") },
      { name: "Interactive tutorial", from: "anthropics/prompt-eng-interactive-tutorial", href: gh("anthropics/prompt-eng-interactive-tutorial") },
      { name: "Anthropic courses", from: "anthropics/courses", href: gh("anthropics/courses") },
    ],
  },
  {
    label: "agents",
    title: "Agent files",
    standard: { name: "agents.md", href: "https://agents.md" },
    cards: [
      { name: "ARR's own AGENTS.md", from: "AgenticResourceRegistry", href: gh("AgenticResourceRegistry/AgenticResourceRegistry/blob/HEAD/AGENTS.md") },
      { name: "MongoDB Node driver", from: "mongodb/node-mongodb-native", href: gh("mongodb/node-mongodb-native/blob/HEAD/AGENTS.md") },
      { name: "Supabase pg-toolbelt", from: "supabase/pg-toolbelt", href: gh("supabase/pg-toolbelt/blob/HEAD/AGENTS.md") },
      { name: "Cluster API OpenStack", from: "kubernetes-sigs", href: gh("kubernetes-sigs/cluster-api-provider-openstack/blob/HEAD/AGENTS.md") },
      { name: "1Password SCAM", from: "1Password/SCAM", href: gh("1Password/SCAM/blob/HEAD/AGENTS.md") },
      { name: "BBC bug", from: "bbc/bug", href: gh("bbc/bug/blob/HEAD/AGENTS.md") },
    ],
  },
  {
    label: "sandbox",
    title: "Sandboxes",
    standard: { name: "agenticresourceregistry.io", href: "https://agenticresourceregistry.io/" },
    cards: [
      { name: "E2B", from: "e2b-dev/E2B", href: gh("e2b-dev/E2B") },
      { name: "Daytona", from: "daytonaio/daytona", href: gh("daytonaio/daytona") },
      { name: "Modal", from: "modal-labs/modal-client", href: gh("modal-labs/modal-client") },
    ],
  },
];
