
interface PurchaseOrderProps {
  order: {
    poNumber: string;
    createdAt: Date;
    subtotal: number;
    tax: number;
    total: number;
    items: any[];
    notes: string | null;
    supplier: {
      name: string;
      email: string;
      phone: string | null;
      contactPerson: string | null;
      address: string | null;
      city: string | null;
      postcode: string | null;
      paymentTerms: string | null;
    };
    job: {
      jobNumber: string;
      scheduledDate: Date | null;
      lead: {
        name: string;
        address: string;
        phone: string;
      };
    };
  };
}

export default function PurchaseOrderTemplate({ order }: PurchaseOrderProps) {
  return (
    <div className="bg-white">
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">
              PURCHASE ORDER
            </h1>
            <div className="text-2xl font-bold mb-4">{order.poNumber}</div>
            <div className="space-y-1">
              <div className="font-bold text-lg">Sun Direct Power</div>
              <div className="text-sm">Solar Installation Services</div>
              <div className="text-sm">Sydney, Australia</div>
              <div className="text-sm">Phone: (02) 1234 5678</div>
              <div className="text-sm">Email: orders@sundirectpower.com.au</div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-2">Order Date</div>
              <div className="font-bold text-lg">
                {new Date(order.createdAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {order.job.scheduledDate && (
                <>
                  <div className="text-sm text-gray-600 mt-4 mb-2">
                    Required By
                  </div>
                  <div className="font-bold">
                    {new Date(order.job.scheduledDate).toLocaleDateString(
                      "en-AU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier and Delivery Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="bg-gray-100 px-4 py-2 font-bold border-l-4 border-blue-600 mb-3">
            SUPPLIER
          </div>
          <div className="space-y-1 pl-4">
            <div className="font-bold text-lg">{order.supplier.name}</div>
            {order.supplier.contactPerson && (
              <div className="text-sm">
                Attn: {order.supplier.contactPerson}
              </div>
            )}
            {order.supplier.address && (
              <div className="text-sm">{order.supplier.address}</div>
            )}
            {order.supplier.city && order.supplier.postcode && (
              <div className="text-sm">
                {order.supplier.city}, {order.supplier.postcode}
              </div>
            )}
            <div className="text-sm mt-2">
              <strong>Email:</strong> {order.supplier.email}
            </div>
            {order.supplier.phone && (
              <div className="text-sm">
                <strong>Phone:</strong> {order.supplier.phone}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-gray-100 px-4 py-2 font-bold border-l-4 border-blue-600 mb-3">
            DELIVER TO
          </div>
          <div className="space-y-1 pl-4">
            <div className="font-bold text-lg">{order.job.lead.name}</div>
            <div className="text-sm">{order.job.lead.address}</div>
            <div className="text-sm mt-2">
              <strong>Phone:</strong> {order.job.lead.phone}
            </div>
            <div className="text-sm">
              <strong>Job Reference:</strong> {order.job.jobNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mb-8">
        <div className="bg-blue-600 text-white px-4 py-2 font-bold mb-2">
          ORDER ITEMS
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold">Description</th>
              <th className="text-center py-3 px-4 font-semibold w-24">
                Quantity
              </th>
              <th className="text-right py-3 px-4 font-semibold w-32">
                Unit Price
              </th>
              <th className="text-right py-3 px-4 font-semibold w-32">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">
                  <div className="font-medium">{item.description}</div>
                  {item.sku && (
                    <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-gray-600 italic mt-1">
                      {item.notes}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {item.quantity} {item.unit}
                </td>
                <td className="py-3 px-4 text-right">
                  ${item.unitCost?.toFixed(2) || "0.00"}
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  ${item.total?.toFixed(2) || "0.00"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-80">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">GST (10%):</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 bg-blue-50 px-4 mt-2 rounded">
              <span className="font-bold text-lg">Total (AUD):</span>
              <span className="font-bold text-lg text-blue-600">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms & Notes */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {order.supplier.paymentTerms && (
          <div>
            <div className="bg-gray-100 px-4 py-2 font-bold border-l-4 border-blue-600 mb-3">
              PAYMENT TERMS
            </div>
            <div className="pl-4 text-sm">{order.supplier.paymentTerms}</div>
          </div>
        )}

        {order.notes && (
          <div>
            <div className="bg-gray-100 px-4 py-2 font-bold border-l-4 border-blue-600 mb-3">
              NOTES
            </div>
            <div className="pl-4 text-sm whitespace-pre-wrap">
              {order.notes}
            </div>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <div className="border-t-2 border-gray-300 pt-6 mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-bold mb-2">Special Instructions:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Please confirm receipt of this purchase order within 24 hours</li>
            <li>Notify us immediately if you cannot meet the delivery date</li>
            <li>
              Include this PO number ({order.poNumber}) on all correspondence and
              invoices
            </li>
            <li>
              Contact us before shipping if there are any changes to specifications
            </li>
          </ul>
        </div>
      </div>

      {/* Signature Section */}
      <div className="border-t-2 border-gray-300 pt-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-16">
              <div className="border-b-2 border-gray-400 pb-1 mb-2 w-64"></div>
              <div className="text-sm font-semibold">Authorized By</div>
              <div className="text-sm text-gray-600">Sun Direct Power</div>
            </div>
          </div>
          <div>
            <div className="mb-16">
              <div className="border-b-2 border-gray-400 pb-1 mb-2 w-64"></div>
              <div className="text-sm font-semibold">Date</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 mt-8 text-center text-sm text-gray-600">
        <p>
          This is a computer-generated purchase order and is valid without a
          signature.
        </p>
        <p className="mt-1">
          Sun Direct Power | ABN: 12 345 678 901 | www.sundirectpower.com.au
        </p>
      </div>
    </div>
  );
}
