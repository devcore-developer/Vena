const requests = new Map();

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  if (requests.has(identifier)) {
    const timestamps = requests.get(identifier).filter((t: number) => t > windowStart);
    requests.set(identifier, timestamps);
  } else {
    requests.set(identifier, []);
  }

  const currentRequests = requests.get(identifier);
  
  if (currentRequests.length >= limit) {
    return { success: false, message: "Too many requests. Please try again later." };
  }
  
  currentRequests.push(now);
  return { success: true };
}