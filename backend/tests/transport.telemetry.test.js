import { describe, it, expect, vi } from 'vitest';
import { evaluateAlerts } from '../src/transport/services/telemetry.service.js';
import { eventBus } from '../src/domain/events/index.js';
import { TRANSPORT_EVENTS } from '../src/domain/events/transport.events.js';

describe('Telemetry Service - Alert Evaluation', () => {
  it('should not emit alert when within thresholds', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const telemetry = {
      temperature: 5.0, // within 2 to 8
      batteryLevel: 50.0, // above 20
      isTampered: false,
    };
    
    const alerts = evaluateAlerts('box1', 'mission1', telemetry);
    expect(alerts).toHaveLength(0);
    expect(emitSpy).not.toHaveBeenCalledWith(TRANSPORT_EVENTS.TELEMETRY_ALERT, expect.anything());
  });

  it('should emit alert when temperature is too high', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const telemetry = {
      temperature: 10.0, // > 8
      batteryLevel: 50.0,
      isTampered: false,
    };
    
    const alerts = evaluateAlerts('box1', 'mission1', telemetry);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatch(/Temperature high/);
    expect(emitSpy).toHaveBeenCalledWith(TRANSPORT_EVENTS.TELEMETRY_ALERT, expect.objectContaining({ boxId: 'box1' }));
  });

  it('should emit alert when battery is low', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const telemetry = {
      temperature: 4.0,
      batteryLevel: 10.0, // < 20
      isTampered: false,
    };
    
    const alerts = evaluateAlerts('box1', 'mission1', telemetry);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatch(/Battery low/);
  });

  it('should emit multiple alerts when multiple conditions fail', () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    const telemetry = {
      temperature: -1.0, // low
      batteryLevel: 15.0, // low
      isTampered: true, // tamper
    };
    
    const alerts = evaluateAlerts('box1', 'mission1', telemetry);
    expect(alerts).toHaveLength(3);
  });
});
