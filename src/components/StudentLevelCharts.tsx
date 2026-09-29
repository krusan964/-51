import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GraduationCap, PieChart as PieIcon, BarChart3, Users, CheckCircle } from 'lucide-react';
import { EducationLevel, LEVEL_NAMES, RegistrationRecord, Student } from '../types';

interface StudentLevelChartsProps {
  students: Student[];
  registrations: RegistrationRecord[];
  currentSemester: string;
  selectedLevel: 'all' | EducationLevel;
  onSelectLevel: (level: 'all' | EducationLevel) => void;
}

const LEVEL_COLORS: Record<EducationLevel, { main: string; light: string; border: string }> = {
  '1': { main: '#d97706', light: '#fef3c7', border: '#f59e0b' }, // Amber - Primary
  '2': { main: '#2563eb', light: '#dbeafe', border: '#3b82f6' }, // Blue - Junior
  '3': { main: '#7c3aed', light: '#ede9fe', border: '#8b5cf6' }, // Purple - Senior
};

export const StudentLevelCharts: React.FC<StudentLevelChartsProps> = ({
  students,
  registrations,
  currentSemester,
  selectedLevel,
  onSelectLevel,
}) => {
  const levelStats = useMemo(() => {
    const counts: Record<EducationLevel, { total: number; registered: number }> = {
      '1': { total: 0, registered: 0 },
      '2': { total: 0, registered: 0 },
      '3': { total: 0, registered: 0 },
    };

    const registeredStudentIds = new Set(
      registrations
        .filter((r) => r.semester === currentSemester && r.subjects && r.subjects.length > 0)
        .map((r) => r.studentId)
    );

    students.forEach((s) => {
      const lvl = (s.level === '1' || s.level === '2' || s.level === '3' ? s.level : '2') as EducationLevel;
      if (counts[lvl]) {
        counts[lvl].total += 1;
        if (registeredStudentIds.has(s.id)) {
          counts[lvl].registered += 1;
        }
      }
    });

    const totalStudents = students.length || 1;

    return (['1', '2', '3'] as EducationLevel[]).map((lvl) => {
      const data = counts[lvl];
      const percent = Math.round((data.total / totalStudents) * 100);
      return {
        levelKey: lvl,
        name: LEVEL_NAMES[lvl],
        total: data.total,
        registered: data.registered,
        unregistered: Math.max(0, data.total - data.registered),
        percentage: percent,
        color: LEVEL_COLORS[lvl].main,
      };
    });
  }, [students, registrations, currentSemester]);

  const totalCount = students.length;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              สัดส่วนจำนวนนักศึกษาตามระดับการศึกษา (Student Level Distribution)
            </h3>
            <p className="text-xs text-slate-500">
              ประถมศึกษา, มัธยมศึกษาตอนต้น (ม.ต้น), และมัธยมศึกษาตอนปลาย (ม.ปลาย)
            </p>
          </div>
        </div>

        {/* Quick Level Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-slate-400 text-[11px] mr-1">คลิกกรอง:</span>
          <button
            type="button"
            onClick={() => onSelectLevel('all')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
              selectedLevel === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          {levelStats.map((stat) => (
            <button
              key={stat.levelKey}
              type="button"
              onClick={() => onSelectLevel(stat.levelKey as EducationLevel)}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                selectedLevel === stat.levelKey
                  ? 'text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{
                backgroundColor: selectedLevel === stat.levelKey ? stat.color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedLevel === stat.levelKey ? '#ffffff' : stat.color }}
              />
              <span>{stat.name}</span>
              <span className="opacity-90 font-mono text-[11px]">({stat.total})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Chart & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Pie Chart with center info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} คน (${item?.payload?.percentage || 0}%)`,
                    item?.payload?.name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Pie
                  data={levelStats}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    const key = entry?.levelKey || entry?.payload?.levelKey;
                    if (key) onSelectLevel(key as EducationLevel);
                  }}
                >
                  {levelStats.map((entry) => (
                    <Cell
                      key={entry.levelKey}
                      fill={entry.color}
                      stroke={selectedLevel === entry.levelKey ? '#0f172a' : '#ffffff'}
                      strokeWidth={selectedLevel === entry.levelKey ? 3 : 1.5}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Center text overlay inside Donut */}
          <div className="absolute top-[48%] -translate-y-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">คนทั้งหมด</span>
          </div>

          {/* Quick Legend Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            {levelStats.map((item) => (
              <div
                key={item.levelKey}
                onClick={() => onSelectLevel(item.levelKey as EducationLevel)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  selectedLevel === item.levelKey ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700">{item.name}:</span>
                <span className="font-semibold text-slate-900">{item.total}</span>
                <span className="text-slate-400 text-[10px]">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart comparing Total vs Registered in current Semester (7 cols) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              สถานะการลงทะเบียนเรียนแยกตามระดับ (ภาคเรียนที่ {currentSemester})
            </span>
            <span className="text-[11px] text-slate-400">หน่วย: คน</span>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={levelStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${val} คน`,
                    name === 'registered' ? 'ลงทะเบียนแล้ว' : 'ยังไม่ได้ลงทะเบียน',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">
                      {value === 'registered' ? 'ลงทะเบียนแล้วในเทอมนี้' : 'ยังไม่ได้ลงทะเบียน'}
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: '8px' }}
                />
                <Bar
                  dataKey="registered"
                  name="registered"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="unregistered"
                  name="unregistered"
                  stackId="a"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Level Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
            {levelStats.map((item) => (
              <div
                key={item.levelKey}
                onClick={() => onSelectLevel(item.levelKey as EducationLevel)}
                className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{item.name}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-900">{item.total}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    ลงทะเบียน {item.registered}/{item.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
