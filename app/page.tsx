'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import UserSettings from './components/UserSettings';
import VersionHistory from './components/VersionHistory';
import { getBedData, saveBedData as saveBedDataAction, getBedVersions, clearBedData as clearBedDataAction } from './actions/bed-actions';

interface PatientData {
  age: string;
  gender: string;
  complaints: string;
  investigation: string;
  management: string;
  consultations: string;
  results: string;
  pendingDischarge: boolean;
  drugAllergy: string;
  privateMedications: string;
  lastUpdated?: string;
}

const teamBeds: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 41, 42, 48, 49],
  2: [9, 10, 11, 12, 13, 14, 15, 16, 31, 32, 33, 34],
  3: [17, 18, 19, 20, 21, 22, 23, 35, 37, 38, 39, 40, 43],
  4: [24, 25, 26, 27, 28, 29, 30, 36, 44, 45, 46, 47]
};

const commonComplaints = [
  'Abdominal Pain',
  'Chest Pain',
  'Dizziness',
  'Fall',
  'Fever',
  'Headache',
  'LOC (Loss of Consciousness)',
  'Nausea/Vomiting',
  'Shortness of Breath',
  'Weakness'
];

const commonAllergies = [
  'Penicillin',
  'Cephalosporins',
  'Sulfa drugs',
  'NSAIDs',
  'Aspirin',
  'Contrast dye',
  'Latex',
  'Shellfish',
  'Eggs',
  'Peanuts',
  'NKDA (No Known Drug Allergies)'
];

const commonPrivateMedications = [
  'Aspirin',
  'Clopidogrel (Plavix)',
  'Warfarin',
  'Rivaroxaban (Xarelto)',
  'Metformin',
  'Insulin',
  'Levothyroxine',
  'Amlodipine',
  'Atorvastatin',
  'Omeprazole',
  'Paracetamol',
  'Ibuprofen'
];

const BedCard = memo(({ 
  bed, 
  data, 
  onUpdate, 
  onSave, 
  onClear, 
  onBack,
  onShowVersionHistory,
  savedIndicator,
  showVersionHistoryButton
}: { 
  bed: number;
  data: PatientData;
  onUpdate: (bed: number, field: keyof PatientData, value: string | boolean) => void;
  onSave: (bed: number) => void;
  onClear: (bed: number) => void;
  onBack: () => void;
  onShowVersionHistory: () => void;
  savedIndicator: boolean;
  showVersionHistoryButton: boolean;
}) => {
  const [showComplaintsMenu, setShowComplaintsMenu] = useState(false);
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [showAllergiesMenu, setShowAllergiesMenu] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [showMedicationsMenu, setShowMedicationsMenu] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const allergiesMenuRef = useRef<HTMLDivElement>(null);
  const medicationsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowComplaintsMenu(false);
        setSelectedComplaints([]);
      }
      if (allergiesMenuRef.current && !allergiesMenuRef.current.contains(event.target as Node)) {
        setShowAllergiesMenu(false);
        setSelectedAllergies([]);
      }
      if (medicationsMenuRef.current && !medicationsMenuRef.current.contains(event.target as Node)) {
        setShowMedicationsMenu(false);
        setSelectedMedications([]);
      }
    };

    if (showComplaintsMenu || showAllergiesMenu || showMedicationsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showComplaintsMenu, showAllergiesMenu, showMedicationsMenu]);

  const toggleComplaint = (complaint: string) => {
    setSelectedComplaints(prev => 
      prev.includes(complaint)
        ? prev.filter(c => c !== complaint)
        : [...prev, complaint]
    );
  };

  const addSelectedComplaints = () => {
    if (selectedComplaints.length === 0) return;
    
    const currentValue = data.complaints;
    const newComplaints = selectedComplaints.join(', ');
    const newValue = currentValue 
      ? `${currentValue}, ${newComplaints}` 
      : newComplaints;
    
    onUpdate(bed, 'complaints', newValue);
    setSelectedComplaints([]);
    setShowComplaintsMenu(false);
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const addSelectedAllergies = () => {
    if (selectedAllergies.length === 0) return;
    const currentValue = data.drugAllergy || '';
    const newAllergies = selectedAllergies.join(', ');
    const newValue = currentValue ? `${currentValue}, ${newAllergies}` : newAllergies;
    onUpdate(bed, 'drugAllergy', newValue);
    setSelectedAllergies([]);
    setShowAllergiesMenu(false);
  };

  const toggleMedication = (medication: string) => {
    setSelectedMedications(prev => 
      prev.includes(medication) ? prev.filter(m => m !== medication) : [...prev, medication]
    );
  };

  const addSelectedMedications = () => {
    if (selectedMedications.length === 0) return;
    const currentValue = data.privateMedications || '';
    const newMedications = selectedMedications.join(', ');
    const newValue = currentValue ? `${currentValue}, ${newMedications}` : newMedications;
    onUpdate(bed, 'privateMedications', newValue);
    setSelectedMedications([]);
    setShowMedicationsMenu(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            ← Teams
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Bed {bed}</h2>
          <div className="w-20"></div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={data.age}
                onChange={(e) => onUpdate(bed, 'age', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={data.gender}
                onChange={(e) => onUpdate(bed, 'gender', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all appearance-none text-gray-900"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discharge</label>
              <div className="flex items-center justify-center h-[42px] bg-gray-50 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id={`discharge-${bed}`}
                  checked={data.pendingDischarge || false}
                  onChange={(e) => onUpdate(bed, 'pendingDischarge', e.target.checked)}
                  className="w-5 h-5 text-yellow-600 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500/20"
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Chief Complaints</label>
              <button
                type="button"
                onClick={() => setShowComplaintsMenu(!showComplaintsMenu)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {showComplaintsMenu && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-12 z-10 bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-80 max-h-96 overflow-y-auto"
              >
                <div className="text-sm text-gray-900 mb-3 font-medium">
                  {selectedComplaints.length} selected
                </div>
                <div className="space-y-2 mb-4">
                  {commonComplaints.map((complaint) => (
                    <label
                      key={complaint}
                      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedComplaints.includes(complaint)
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedComplaints.includes(complaint)}
                        onChange={() => toggleComplaint(complaint)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-sm font-medium">{complaint}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSelectedComplaints}
                    disabled={selectedComplaints.length === 0}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedComplaints.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Add Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaints([]);
                      setShowComplaintsMenu(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={data.complaints}
              onChange={(e) => onUpdate(bed, 'complaints', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none text-gray-900"
              rows={3}
              placeholder="Select from menu or type..."
            />
          </div>


          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Drug Allergy</label>
              <button
                type="button"
                onClick={() => setShowAllergiesMenu(!showAllergiesMenu)}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {showAllergiesMenu && (
              <div 
                ref={allergiesMenuRef}
                className="absolute right-0 top-12 z-10 bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-80 max-h-96 overflow-y-auto"
              >
                <div className="text-sm text-gray-900 mb-3 font-medium">
                  {selectedAllergies.length} selected
                </div>
                <div className="space-y-2 mb-4">
                  {commonAllergies.map((allergy) => (
                    <label
                      key={allergy}
                      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedAllergies.includes(allergy)
                          ? 'bg-red-50 text-red-900'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAllergies.includes(allergy)}
                        onChange={() => toggleAllergy(allergy)}
                        className="mr-3 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-2 focus:ring-red-500/20"
                      />
                      <span className="text-sm font-medium">{allergy}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSelectedAllergies}
                    disabled={selectedAllergies.length === 0}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedAllergies.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Add Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAllergies([]);
                      setShowAllergiesMenu(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={data.drugAllergy || ''}
              onChange={(e) => onUpdate(bed, 'drugAllergy', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all resize-none text-gray-900"
              rows={2}
              placeholder="Select from menu or type..."
            />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Private Medications</label>
              <button
                type="button"
                onClick={() => setShowMedicationsMenu(!showMedicationsMenu)}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                + Add
              </button>
            </div>
            
            {showMedicationsMenu && (
              <div 
                ref={medicationsMenuRef}
                className="absolute right-0 top-12 z-10 bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-80 max-h-96 overflow-y-auto"
              >
                <div className="text-sm text-gray-900 mb-3 font-medium">
                  {selectedMedications.length} selected
                </div>
                <div className="space-y-2 mb-4">
                  {commonPrivateMedications.map((medication) => (
                    <label
                      key={medication}
                      className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        selectedMedications.includes(medication)
                          ? 'bg-purple-50 text-purple-900'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMedications.includes(medication)}
                        onChange={() => toggleMedication(medication)}
                        className="mr-3 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <span className="text-sm font-medium">{medication}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSelectedMedications}
                    disabled={selectedMedications.length === 0}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedMedications.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Add Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMedications([]);
                      setShowMedicationsMenu(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <textarea
              value={data.privateMedications || ''}
              onChange={(e) => onUpdate(bed, 'privateMedications', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all resize-none text-gray-900"
              rows={2}
              placeholder="Select from menu or type..."
            />
          </div>

          {['investigation', 'management', 'consultations', 'results'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {field === 'results' ? 'Test Results' : field}
              </label>
              <textarea
                value={data[field as keyof PatientData] as string}
                onChange={(e) => onUpdate(bed, field as keyof PatientData, e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none text-gray-900"
                rows={3}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onSave(bed)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Save
            </button>
            {showVersionHistoryButton && (
              <button
                onClick={onShowVersionHistory}
                className="px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg transition-colors"
                title="查看版本歷史"
              >
                📜
              </button>
            )}
            <button
              onClick={() => onClear(bed)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
          
          {savedIndicator && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Saved successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BedCard.displayName = 'BedCard';

export default function Home() {
  const [view, setView] = useState<'team-select' | 'dashboard' | 'bed-list' | 'bed-detail'>('team-select');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [bedData, setBedData] = useState<Record<number, PatientData>>({});
  const [savedIndicators, setSavedIndicators] = useState<Record<number, boolean>>({});
  
  // New states for version history and settings
  const [showSettings, setShowSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentShift, setCurrentShift] = useState<string>('AM');
  const [nurseName, setNurseName] = useState<string>('');
  const [userSettings, setUserSettings] = useState({
    showVersionHistory: true,
    showShiftColors: true,
    highlightChanges: true,
    compactMode: false,
    notifyOnChanges: true
  });
  const [bedVersions, setBedVersions] = useState<Record<number, any[]>>({});

  useEffect(() => {
    // Load settings from localStorage
    const savedTeam = localStorage.getItem('selectedTeam');
    if (savedTeam) {
      setSelectedTeam(parseInt(savedTeam));
    }

    const savedNurseName = localStorage.getItem('nurseName');
    if (savedNurseName) {
      setNurseName(savedNurseName);
    }

    const savedShift = localStorage.getItem('currentShift');
    if (savedShift) {
      setCurrentShift(savedShift);
    }

    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setUserSettings(JSON.parse(savedSettings));
    }

    // Load all beds data from database on mount
    const loadAllBedsData = async () => {
      try {
        const allBeds = Object.values(teamBeds).flat();
        const loadedData: Record<number, PatientData> = {};

        for (const bed of allBeds) {
          const data = await getBedData(bed.toString());
          if (data && (data.age || data.gender || data.complaints)) {
            loadedData[bed] = data;
          }
        }

        setBedData(loadedData);
      } catch (error) {
        console.error('Error loading beds data:', error);
      }
    };

    loadAllBedsData();
  }, []);

  const selectTeam = useCallback((team: number) => {
    setSelectedTeam(team);
    setSelectedBed(null);
    setView('bed-list');
    localStorage.setItem('selectedTeam', team.toString());
  }, []);

  const selectBed = useCallback(async (bed: number) => {
    setSelectedBed(bed);
    setView('bed-detail');

    // Load version history for this bed
    try {
      const versions = await getBedVersions(bed.toString());
      setBedVersions(prev => ({ ...prev, [bed]: versions }));
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  }, []);

  const backToBedList = useCallback(() => {
    setSelectedBed(null);
    setView('bed-list');
  }, []);

  const backToTeamSelect = useCallback(() => {
    setSelectedTeam(null);
    setSelectedBed(null);
    setView('team-select');
  }, []);

  const showDashboard = useCallback(() => {
    setView('dashboard');
  }, []);

  const updateBedData = useCallback((bed: number, field: keyof PatientData, value: string | boolean) => {
    setBedData(prev => ({
      ...prev,
      [bed]: {
        ...(prev[bed] || {
          age: '',
          gender: '',
          complaints: '',
          investigation: '',
          management: '',
          consultations: '',
          results: '',
          pendingDischarge: false
        }),
        [field]: value,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);

  const saveBedData = useCallback(async (bed: number) => {
    const data = bedData[bed];
    if (data) {
      try {
        const result = await saveBedDataAction(
          bed.toString(),
          data,
          nurseName || 'Unknown',
          currentShift
        );

        if (result.success) {
          setSavedIndicators(prev => ({ ...prev, [bed]: true }));
          setTimeout(() => {
            setSavedIndicators(prev => ({ ...prev, [bed]: false }));
          }, 2000);
        } else {
          alert('保存失敗，請重試');
        }
      } catch (error) {
        console.error('Error saving bed data:', error);
        alert('保存失敗，請檢查網絡連接');
      }
    }
  }, [bedData, nurseName, currentShift]);

  const clearBedData = useCallback(async (bed: number) => {
    if (confirm(`Clear all data for Bed ${bed}?`)) {
      try {
        const result = await clearBedDataAction(bed.toString());

        if (result.success) {
          setBedData(prev => {
            const newData = { ...prev };
            delete newData[bed];
            return newData;
          });
        } else {
          alert('清除失敗，請重試');
        }
      } catch (error) {
        console.error('Error clearing bed data:', error);
        alert('清除失敗，請檢查網絡連接');
      }
    }
  }, []);

  const exportTeamData = useCallback((team: number) => {
    const beds = teamBeds[team];
    let exportText = `TEAM ${team} HANDOVER REPORT\n`;
    exportText += `Generated: ${new Date().toLocaleString()}\n`;
    exportText += `${'='.repeat(80)}\n\n`;

    beds.forEach(bed => {
      const data = bedData[bed];
      if (data && (data.age || data.gender || data.complaints)) {
        exportText += `BED ${bed}\n`;
        exportText += `${'-'.repeat(40)}\n`;
        exportText += `Age: ${data.age || 'N/A'} | Gender: ${data.gender || 'N/A'}\n`;
        exportText += `Chief Complaints: ${data.complaints || 'N/A'}\n`;
        exportText += `Investigation: ${data.investigation || 'N/A'}\n`;
        exportText += `Management: ${data.management || 'N/A'}\n`;
        exportText += `Consultations: ${data.consultations || 'N/A'}\n`;
        exportText += `Test Results: ${data.results || 'N/A'}\n\n`;
      }
    });

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Team${team}_Handover_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [bedData]);

  const getDefaultData = useCallback((bed: number): PatientData => {
    return bedData[bed] || {
      age: '',
      gender: '',
      complaints: '',
      investigation: '',
      management: '',
      consultations: '',
      results: '',
      pendingDischarge: false,
      drugAllergy: '',
      privateMedications: ''
    };
  }, [bedData]);

  const hasData = useCallback((bed: number): boolean => {
    const data = bedData[bed];
    return !!(data && (data.age || data.gender || data.complaints || data.investigation || data.management || data.consultations || data.results));
  }, [bedData]);

  const getTeamStats = useCallback((team: number) => {
    const beds = teamBeds[team];
    const occupied = beds.filter(bed => hasData(bed)).length;
    const total = beds.length;
    const percentage = Math.round((occupied / total) * 100);
    
    let maleCount = 0;
    let femaleCount = 0;
    let pendingDischargeCount = 0;
    beds.forEach(bed => {
      const data = bedData[bed];
      if (data && hasData(bed)) {
        if (data.gender === 'M') maleCount++;
        if (data.gender === 'F') femaleCount++;
        if (data.pendingDischarge) pendingDischargeCount++;
      }
    });
    
    return { occupied, total, percentage, maleCount, femaleCount, pendingDischargeCount };
  }, [hasData, bedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Nursing Handover System</h1>
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Nurse Name Input */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">👤</span>
                  <input
                    type="text"
                    value={nurseName}
                    onChange={(e) => {
                      setNurseName(e.target.value);
                      localStorage.setItem('nurseName', e.target.value);
                    }}
                    placeholder="護士名"
                    className="w-24 px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                {/* Shift Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">🕐</span>
                  <select
                    value={currentShift}
                    onChange={(e) => {
                      setCurrentShift(e.target.value);
                      localStorage.setItem('currentShift', e.target.value);
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      currentShift === 'AM' ? 'bg-yellow-50 border-yellow-300 text-yellow-900' :
                      currentShift === 'PM' ? 'bg-blue-50 border-blue-300 text-blue-900' :
                      'bg-purple-50 border-purple-300 text-purple-900'
                    }`}
                  >
                    <option value="AM">🌅 AM 早更</option>
                    <option value="PM">☀️ PM 下午更</option>
                    <option value="Night">🌙 Night 夜更</option>
                  </select>
                </div>
                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="設定"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <UserSettings
            settings={userSettings}
            onUpdate={(newSettings) => {
              setUserSettings(newSettings);
              localStorage.setItem('userSettings', JSON.stringify(newSettings));
            }}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Version History Modal */}
        {showVersionHistory && selectedBed && (
          <VersionHistory
            versions={bedVersions[selectedBed] || []}
            onClose={() => setShowVersionHistory(false)}
          />
        )}

        {view === 'team-select' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Select Team</h2>
              <button
                onClick={showDashboard}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Dashboard
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(team => (
                <button
                  key={team}
                  onClick={() => selectTeam(team)}
                  className="p-6 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 border border-blue-200 rounded-xl text-lg font-semibold text-gray-900 transition-all shadow-sm hover:shadow-md"
                >
                  Team {team}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Occupancy Dashboard</h2>
              <button
                onClick={backToTeamSelect}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(team => {
                const stats = getTeamStats(team);
                return (
                  <div key={team} className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Team {team}</h3>
                      <span className="text-2xl font-semibold text-gray-900">
                        {stats.occupied}/{stats.total}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-600">♂</span>
                        <span>{stats.maleCount} Male</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-pink-600">♀</span>
                        <span>{stats.femaleCount} Female</span>
                      </div>
                      {stats.pendingDischargeCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-600">⚠️</span>
                          <span>{stats.pendingDischargeCount} Discharge</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Occupancy</span>
                        <span>{stats.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stats.percentage >= 80 ? 'bg-red-500' :
                            stats.percentage >= 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-4">
                      {teamBeds[team].map(bed => {
                        const data = bedData[bed];
                        const gender = data?.gender;
                        const isPendingDischarge = data?.pendingDischarge;
                        return (
                          <div
                            key={bed}
                            className={`text-center py-2 rounded-lg text-sm font-medium relative ${
                              hasData(bed)
                                ? isPendingDischarge
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <div>{bed}</div>
                            {gender && (
                              <div className="text-xs">
                                {gender === 'M' ? '♂' : gender === 'F' ? '♀' : ''}
                              </div>
                            )}
                            {isPendingDischarge && (
                              <div className="absolute top-0 right-0 text-xs">⚠️</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => selectTeam(team)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      View Team {team}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'bed-list' && selectedTeam && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Team {selectedTeam}
              </h2>
              <button
                onClick={backToTeamSelect}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                ← Back
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3 mb-8">
              {teamBeds[selectedTeam].map(bed => {
                const data = bedData[bed];
                const gender = data?.gender;
                const isPendingDischarge = data?.pendingDischarge;
                return (
                  <button
                    key={bed}
                    onClick={() => selectBed(bed)}
                    className={`aspect-square flex flex-col items-center justify-center text-lg font-bold rounded-xl transition-all relative ${
                      hasData(bed)
                        ? isPendingDischarge
                          ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div>{bed}</div>
                    {gender && (
                      <div className="text-sm font-bold">
                        {gender === 'M' ? '♂' : gender === 'F' ? '♀' : ''}
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 flex gap-0.5 text-xs">
                      {data?.drugAllergy && <span title="Drug Allergy">🚫</span>}
                      {data?.privateMedications && <span title="Private Medications">💊</span>}
                    </div>
                    {isPendingDischarge && (
                      <div className="absolute top-1 right-1 text-base">⚠️</div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <button
                onClick={() => exportTeamData(selectedTeam)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Export Team {selectedTeam} Data
              </button>
            </div>
          </div>
        )}

        {view === 'bed-detail' && selectedTeam && selectedBed && (
          <div className="p-8">
            <BedCard
              bed={selectedBed}
              data={getDefaultData(selectedBed)}
              onUpdate={updateBedData}
              onSave={saveBedData}
              onClear={clearBedData}
              onBack={backToBedList}
              onShowVersionHistory={() => setShowVersionHistory(true)}
              savedIndicator={savedIndicators[selectedBed] || false}
              showVersionHistoryButton={userSettings.showVersionHistory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
