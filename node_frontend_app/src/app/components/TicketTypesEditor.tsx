import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Ticket } from 'lucide-react';
import type { TicketTypeDraft } from '../types';
import { newTicketTypeRow } from '../api';

interface TicketTypesEditorProps {
    rows: TicketTypeDraft[];
    onChange: (rows: TicketTypeDraft[]) => void;
    /** Event-level defaults (single-ticket pricing on the event record) */
    eventPrice: number;
    eventMaxCapacity: number;
    eventWaitlistCapacity?: number;
}

export function TicketTypesEditor({
    rows,
    onChange,
    eventPrice,
    eventMaxCapacity,
    eventWaitlistCapacity = 0,
}: TicketTypesEditorProps) {
    const updateRow = (localKey: string, patch: Partial<TicketTypeDraft>) => {
        onChange(rows.map((r) => (r.localKey === localKey ? { ...r, ...patch } : r)));
    };

    const removeRow = (localKey: string) => {
        if (rows.length <= 1) return;
        onChange(rows.filter((r) => r.localKey !== localKey));
    };

    const addRow = () => {
        onChange([...rows, newTicketTypeRow({ price: eventPrice, totalQuantity: Math.max(1, Math.floor(eventMaxCapacity / (rows.length + 1))) })]);
    };

    const applyEventDefaultsToFirstRow = () => {
        if (rows.length === 0) {
            onChange([
                newTicketTypeRow({
                    ticketType: 'General',
                    price: eventPrice,
                    totalQuantity: eventMaxCapacity,
                    waitlistCapacity: eventWaitlistCapacity,
                }),
            ]);
            return;
        }
        const [first, ...rest] = rows;
        onChange([
            {
                ...first,
                price: eventPrice,
                totalQuantity: eventMaxCapacity,
                waitlistCapacity: eventWaitlistCapacity,
            },
            ...rest,
        ]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Ticket types
                </CardTitle>
                <CardDescription>
                    Define ticket tiers (name, price, quantity). 
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addRow}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add ticket type
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={applyEventDefaultsToFirstRow}>
                        Copy event price &amp; capacity to first row
                    </Button>
                </div>

                <div className="space-y-4">
                    {rows.map((row, index) => (
                        <div
                            key={row.localKey}
                            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Type {index + 1}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeRow(row.localKey)}
                                    disabled={rows.length <= 1}
                                    aria-label="Remove ticket type"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`tt-name-${row.localKey}`}>Name *</Label>
                                    <Input
                                        id={`tt-name-${row.localKey}`}
                                        value={row.ticketType}
                                        onChange={(e) => updateRow(row.localKey, { ticketType: e.target.value })}
                                        placeholder="e.g. General, VIP"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`tt-price-${row.localKey}`}>Price (USD) *</Label>
                                    <Input
                                        id={`tt-price-${row.localKey}`}
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={row.price}
                                        onChange={(e) => updateRow(row.localKey, { price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`tt-qty-${row.localKey}`}>Quantity *</Label>
                                    <Input
                                        id={`tt-qty-${row.localKey}`}
                                        type="number"
                                        min={1}
                                        value={row.totalQuantity}
                                        onChange={(e) =>
                                            updateRow(row.localKey, { totalQuantity: Number(e.target.value) })
                                        }
                                    />
                                    {row.backendId != null && row.soldQuantity != null && row.soldQuantity > 0 && (
                                        <p className="text-xs text-amber-700">
                                            {row.soldQuantity} sold — do not reduce quantity below sold count.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`tt-wl-${row.localKey}`}>Waitlist capacity</Label>
                                    <Input
                                        id={`tt-wl-${row.localKey}`}
                                        type="number"
                                        min={0}
                                        value={row.waitlistCapacity}
                                        onChange={(e) =>
                                            updateRow(row.localKey, { waitlistCapacity: Number(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`tt-desc-${row.localKey}`}>Description</Label>
                                <Textarea
                                    id={`tt-desc-${row.localKey}`}
                                    value={row.description}
                                    onChange={(e) => updateRow(row.localKey, { description: e.target.value })}
                                    placeholder="Optional details shown internally"
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
