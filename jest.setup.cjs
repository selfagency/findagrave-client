// Global test setup for CommonJS Jest environment
// This file is .cjs to work with ES module projects

// Mock TextEncoder/TextDecoder for Node.js environment if needed
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
