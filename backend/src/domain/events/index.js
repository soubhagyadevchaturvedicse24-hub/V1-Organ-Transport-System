import EventEmitter from 'events';
import logger from '../../logger/index.js';

class DomainEventBus extends EventEmitter {
  emit(event, payload) {
    logger.info(`[EventBus] Emitting ${event}`, { event });
    super.emit(event, payload);
  }
}

export const eventBus = new DomainEventBus();
