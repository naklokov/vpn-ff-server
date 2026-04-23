type Meta = Record<string, unknown> | undefined;

const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
};

const stringifyMeta = (meta?: Meta): string => {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
};

const write = (
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  meta?: Meta,
): void => {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${stringifyMeta(meta)}`;
  if (level === "ERROR") {
    console.error(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  console.log(line);
};

export const logger = {
  info: (message: string, meta?: Meta): void => write("INFO", message, meta),
  warn: (message: string, meta?: Meta): void => write("WARN", message, meta),
  error: (message: string, error?: unknown, meta?: Meta): void =>
    write("ERROR", message, {
      ...(meta ?? {}),
      ...(error === undefined ? {} : { error: serializeError(error) }),
    }),
};
