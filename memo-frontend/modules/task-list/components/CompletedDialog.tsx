'use client';

import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CompletedDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">任务已完成</h3>
        <p className="text-gray-500 mb-6">已完成任务暂不支持取消勾选</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
}