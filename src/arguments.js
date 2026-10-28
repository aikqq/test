export function parseArguments(args, configuration = {}) {
  const flags = new Set(configuration.flags ?? []);
  const repeatable = new Set(configuration.repeatable ?? []);
  const positionals = [];
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const equalsIndex = token.indexOf("=");
    const name = token.slice(2, equalsIndex === -1 ? undefined : equalsIndex);
    if (!name) throw new TypeError("Invalid empty option.");

    if (flags.has(name)) {
      options[name] = true;
      continue;
    }

    let value = equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);
    if (value === undefined) {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("--")) throw new TypeError(`Option --${name} requires a value.`);
      value = next;
      index += 1;
    }

    if (repeatable.has(name)) {
      options[name] = [...(options[name] ?? []), value];
    } else {
      options[name] = value;
    }
  }

  return { positionals, options };
}

export function rejectUnknownOptions(options, allowed) {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(options).filter((name) => !allowedSet.has(name));
  if (unknown.length > 0) throw new TypeError(`Unknown option: --${unknown[0]}`);
}

