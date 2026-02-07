'use client';

import { useState } from 'react';

interface UserSettingsProps {
  settings: {
    showVersionHistory: boolean;
    showShiftColors: boolean;
    highlightChanges: boolean;
    compactMode: boolean;
    notifyOnChanges: boolean;
  };
  onUpdate: (settings: any) => void;
  onClose: () => void;
}

export default function UserSettings({ settings, onUpdate, onClose }: UserSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (key: keyof typeof settings) => {
    setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">用戶設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">顯示版本歷史</div>
              <div className="text-sm text-gray-500">查看每次修改記錄</div>
            </div>
            <button
              onClick={() => handleToggle('showVersionHistory')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.showVersionHistory ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  localSettings.showVersionHistory ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">更份顏色標記</div>
              <div className="text-sm text-gray-500">用顏色區分不同更份</div>
            </div>
            <button
              onClick={() => handleToggle('showShiftColors')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.showShiftColors ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  localSettings.showShiftColors ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">高亮顯示改動</div>
              <div className="text-sm text-gray-500">標記修改過的內容</div>
            </div>
            <button
              onClick={() => handleToggle('highlightChanges')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.highlightChanges ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  localSettings.highlightChanges ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">簡潔模式</div>
              <div className="text-sm text-gray-500">隱藏額外資訊</div>
            </div>
            <button
              onClick={() => handleToggle('compactMode')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.compactMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  localSettings.compactMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">改動通知</div>
              <div className="text-sm text-gray-500">有修改時通知</div>
            </div>
            <button
              onClick={() => handleToggle('notifyOnChanges')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                localSettings.notifyOnChanges ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  localSettings.notifyOnChanges ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            儲存
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
