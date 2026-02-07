// Demo version history data (replace with real API calls later)
const demoVersions = [
  {
    id: '1',
    shift: 'AM',
    changedBy: 'Nurse Amy',
    changeType: 'created',
    changes: {
      age: { new: '65' },
      complaints: { new: 'Chest Pain' }
    },
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    shift: 'PM',
    changedBy: 'Nurse Bob',
    changeType: 'updated',
    changes: {
      age: { old: '65', new: '66' },
      investigation: { new: 'ECG done' }
    },
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

const demoSettings = {
  showVersionHistory: true,
  showShiftColors: true,
  highlightChanges: true,
  compactMode: false,
  notifyOnChanges: true
};
