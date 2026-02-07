'use client';

import { useState } from 'react';

interface Version {
  id: string;
  shift: string;
  changedBy: string;
  changeType: string;
  changes: any;
  createdAt: string;
}

interface VersionHistoryProps {
  versions: Version[];
  onClose: () => void;
}

const shiftColors = {
  AM: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  PM: 'bg-blue-50 text-blue-900 border-blue-200',
  Night: 'bg-purple-50 text-purple-900 border-purple-200'
};

export default function VersionHistory({ versions, onClose }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">版本歷史</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              暫無版本記錄
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedVersion === version.id
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedVersion(
                    selectedVersion === version.id ? null : version.id
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        shiftColors[version.shift as keyof typeof shiftColors] || 'bg-gray-50 text-gray-900 border-gray-200'
                      }`}>
                        {version.shift}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {version.changedBy}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString('zh-HK')}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      version.changeType === 'created' ? 'bg-green-100 text-green-700' :
                      version.changeType === 'updated' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {version.changeType === 'created' ? '新增' :
                       version.changeType === 'updated' ? '修改' : '刪除'}
                    </span>
                  </div>

                  {selectedVersion === version.id && version.changes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-700 space-y-2">
                        {Object.entries(version.changes).map(([field, change]: [string, any]) => (
                          <div key={field} className="bg-gray-50 rounded p-3">
                            <div className="font-medium text-gray-900 mb-1 capitalize">
                              {field}
                            </div>
                            {change.old && (
                              <div className="text-red-600 line-through mb-1">
                                - {change.old}
                              </div>
                            )}
                            {change.new && (
                              <div className="text-green-600">
                                + {change.new}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span>早更 (AM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span>下午更 (PM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span>夜更 (Night)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
