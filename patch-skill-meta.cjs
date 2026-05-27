const fs = require("fs");

const patches = {
  "skills/skill-create/SKILL.md": {
    version: "0.1.0",
    category: "writing",
  },
  "skills/skill-discovery/SKILL.md": {
    version: "0.1.0",
    category: "utility",
  },
  "skills/skill-review/SKILL.md": {
    version: "0.1.0",
    category: "review",
  },
  "skills/skill-search/SKILL.md": {
    version: "0.1.0",
    category: "utility",
  },
  "skills/skill-summary/SKILL.md": {
    version: "0.1.0",
    category: "summary",
  },
};

for (const [path, meta] of Object.entries(patches)) {
  let content = fs.readFileSync(path, "utf8");

  const matches = [...content.matchAll(/^---\s*$/gm)];
  if (matches.length < 2) {
    console.error(`frontmatter 格式異常：${path}`);
    process.exitCode = 1;
    continue;
  }

  const closingStart = matches[1].index;
  const beforeClosing = content.slice(0, closingStart);
  const afterClosing = content.slice(closingStart);

  const insert = [];

  if (!/^version:/m.test(beforeClosing)) {
    insert.push(`version: ${meta.version}`);
  }

  if (!/^category:/m.test(beforeClosing)) {
    insert.push(`category: ${meta.category}`);
  }

  if (insert.length > 0) {
    content = beforeClosing + insert.join("\n") + "\n" + afterClosing;
    fs.writeFileSync(path, content, "utf8");
    console.log(`fixed: ${path}`);
  } else {
    console.log(`skip: ${path}`);
  }
}
