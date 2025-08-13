
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LEVSystem, BOMItem } from '@/lib/types';
import { 
  FileText, 
  Download, 
  DollarSign, 
  Package, 
  Edit, 
  Plus,
  Trash2,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BOMPanelProps {
  bomItems: BOMItem[];
  system: LEVSystem;
  onUpdateBOM: (items: BOMItem[]) => void;
}

interface BOMCategory {
  name: string;
  items: BOMItem[];
  total: number;
}

export function BOMPanel({ bomItems, system, onUpdateBOM }: BOMPanelProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [costFactors, setCostFactors] = useState({
    ductCost: 25.50,
    fittingCost: 45.75,
    gateCost: 85.00,
    fanCost: 2850.00,
    laborRate: 65.00,
    markup: 1.15
  });

  // Group items by category
  const groupedItems = bomItems.reduce((groups: { [key: string]: BOMCategory }, item) => {
    if (!groups[item.category]) {
      groups[item.category] = {
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        items: [],
        total: 0
      };
    }
    groups[item.category].items.push(item);
    groups[item.category].total += item.totalPrice;
    return groups;
  }, {});

  const totalCost = bomItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const updateItem = (itemId: string, updates: Partial<BOMItem>) => {
    const updatedItems = bomItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
        }
        return updatedItem;
      }
      return item;
    });
    onUpdateBOM(updatedItems);
  };

  const deleteItem = (itemId: string) => {
    const updatedItems = bomItems.filter(item => item.id !== itemId);
    onUpdateBOM(updatedItems);
  };

  const addCustomItem = () => {
    const newItem: BOMItem = {
      id: `custom-${Date.now()}`,
      name: 'Custom Item',
      category: 'miscellaneous',
      quantity: 1,
      unit: 'ea',
      unitPrice: 0,
      totalPrice: 0
    };
    onUpdateBOM([...bomItems, newItem]);
    setEditingItem(newItem.id);
  };

  const exportBOM = () => {
    // Create CSV content
    const headers = ['Item', 'Category', 'Quantity', 'Unit', 'Unit Price (£)', 'Total (£)', 'Specifications'];
    const rows = bomItems.map(item => [
      item.name,
      item.category,
      item.quantity.toString(),
      item.unit,
      item.unitPrice.toFixed(2),
      item.totalPrice.toFixed(2),
      item.specifications || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Add summary
    const summary = [
      '',
      'SUMMARY',
      ...Object.entries(groupedItems).map(([category, data]) => 
        `${data.name},,,,,£${data.total.toFixed(2)},`
      ),
      '',
      `Total Cost,,,,,£${totalCost.toFixed(2)},`,
      `With Markup (${((costFactors.markup - 1) * 100).toFixed(0)}%),,,,,£${(totalCost * costFactors.markup).toFixed(2)},`
    ].join('\n');

    const fullContent = csvContent + '\n' + summary;
    
    // Download file
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${system.name.replace(/\s+/g, '_')}_BOM.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ducting': return '🔧';
      case 'equipment': return '⚡';
      case 'fittings': return '🔩';
      case 'labor': return '👷';
      default: return '📦';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Bill of Materials</h3>
          </div>
          <div className="flex gap-2">
            <Button onClick={addCustomItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
            <Button onClick={exportBOM} size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Subtotal</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              £{totalCost.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Quote</span>
            </div>
            <div className="text-xl font-bold text-green-900">
              £{(totalCost * costFactors.markup).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-green-700">
              Inc. {((costFactors.markup - 1) * 100).toFixed(0)}% markup
            </div>
          </div>
        </div>
      </div>

      {/* BOM Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedItems).length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No items in BOM</p>
              <p className="text-sm">Add components to generate bill of materials</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, data]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <h4 className="font-semibold text-gray-800">{data.name}</h4>
                    <span className="text-sm text-gray-500">({data.items.length} items)</span>
                  </div>
                  <div className="font-bold text-green-600">
                    £{data.total.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  {data.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      {editingItem === item.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(item.id, { name: e.target.value })}
                              className="text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                className="text-sm"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unit</Label>
                              <Input
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unit Price (£)</Label>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="text-sm"
                                step="0.01"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => setEditingItem(null)} size="sm" variant="outline">
                              Done
                            </Button>
                            <Button onClick={() => deleteItem(item.id)} size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} {item.unit} × £{item.unitPrice.toFixed(2)}
                            </div>
                            {item.specifications && (
                              <div className="text-xs text-gray-400 mt-1">{item.specifications}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-green-600">
                              £{item.totalPrice.toFixed(2)}
                            </div>
                            <Button
                              onClick={() => setEditingItem(item.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Cost Factors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h4 className="font-semibold text-gray-800 mb-3">Pricing Factors</h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Markup (%):</span>
                  <Input
                    type="number"
                    value={((costFactors.markup - 1) * 100).toFixed(0)}
                    onChange={(e) => setCostFactors(prev => ({ ...prev, markup: 1 + (parseFloat(e.target.value) || 0) / 100 }))}
                    className="w-20 h-6 text-xs"
                    step="1"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
