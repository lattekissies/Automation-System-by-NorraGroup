"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (item: any) => React.ReactNode;
  align?: "left" | "right" | "center";
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export default function DataTable({ columns, data, emptyMessage = "Belum ada data" }: DataTableProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(15,23,42,0.07)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessorKey}
                  style={{ textAlign: col.align ?? "left" }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-foreground/30">
                    <Inbox className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    <p className="text-xs opacity-70">Data akan muncul di sini</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.04 }}
                  key={rowIndex}
                >
                  {columns.map((col) => (
                    <td
                      key={col.accessorKey}
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
