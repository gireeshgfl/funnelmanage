// lib/eventBus.js
import { EventEmitter } from 'events';

// Create a singleton EventBus
let eventBus;

if (typeof window === 'undefined') {
  // Server-side
  if (!global.eventBus) {
    global.eventBus = new EventEmitter();
  }
  eventBus = global.eventBus;
} else {
  // Client-side
  if (!window.eventBus) {
    window.eventBus = new EventEmitter();
  }
  eventBus = window.eventBus;
}

export default eventBus;
