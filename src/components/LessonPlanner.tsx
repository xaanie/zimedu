import React, { useState, useRef, useEffect } from 'react';
import { GradeLevel, Subject, LessonInput, LessonPlan } from '../types';
import { generateSingleLessonPlan } from '../services/geminiService';
import { generateLessonPDF } from '../utils/pdfGenerator';
import LoadingSpinner from './LoadingSpinner';

interface LessonPlannerProps {
  initialTeacherName: string;
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ initialTeacherName }) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const initialFormState: LessonInput = {
    teacherName: initialTeacherName,
    grade: GradeLevel.Grade3,
    subject: Subject.Math,
    topic: '',
    context: '',
    date: new Date().toISOString().split('T')[0],
    duration: 30
  };

  const [formData, setFormData] = useState<LessonInput>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (generatedPlan && resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatedPlan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({ ...initialFormState, teacherName: formData.teacherName });
    setGeneratedPlan(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.teacherName) {
      setError("Please fill in the Topic and Teacher Name.");
      return;
    }
    setError(null);
    setLoading(true);
    setGeneratedPlan(null);

    try {
      const plan = await generateSingleLessonPlan(formData);
      setGeneratedPlan(plan);
    } catch (err) {
      setError("Failed to generate. Check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Daily Lesson Planner</h2>
        <p className="text-sm text-gray-500 mt-1">Heritage Based Syllabi Aligned</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        {/* Form */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-lg p-5 border-t-4 border-zim-green h-fit lg:sticky lg:top-24">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
             <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Plan Setup</h3>
             <button onClick={handleClear} className="text-[10px] font-bold text-zim-red uppercase hover:underline">Clear</button>
          </div>
          
          <div className="space-y-4">
             <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Teacher</label>
              <input type="text" name="teacherName" value={formData.teacherName} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 shadow-sm border p-3 text-sm focus:ring-zim-green focus:border-zim-green" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Grade</label>
                <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 border p-3 text-sm focus:ring-zim-green focus:border-zim-green">
                  {Object.values(GradeLevel).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Subject</label>
                <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 border p-3 text-xs md:text-sm focus:ring-zim-green focus:border-zim-green">
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Topic</label>
              <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} placeholder="e.g. Mixed Fractions" className="w-full rounded-lg border-gray-200 border p-3 text-sm focus:ring-zim-green focus:border-zim-green" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 border p-3 text-sm focus:ring-zim-green" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mins</label>
                <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 border p-3 text-sm focus:ring-zim-green" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Optional Focus</label>
              <textarea name="context" value={formData.context} onChange={handleInputChange} rows={2} placeholder="Remedial? Practical?" className="w-full rounded-lg border-gray-200 border p-3 text-sm focus:ring-zim-green" />
            </div>

            <button onClick={handleGenerate} disabled={loading} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${loading ? 'bg-gray-400' : 'bg-zim-green hover:bg-green-800'}`}>
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Generating...</> : <><i className="fas fa-magic mr-2"></i> Create Lesson Plan</>}
            </button>
            
            {error && <p className="text-zim-red text-[10px] font-bold text-center uppercase">{error}</p>}
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-8" ref={resultRef}>
          {loading ? (
             <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center justify-center min-h-[400px]">
                <LoadingSpinner subject={formData.subject} />
             </div>
          ) : generatedPlan ? (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 text-white p-4 flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-wider">Plan Ready</h3>
                <button onClick={() => generateLessonPDF(generatedPlan)} className="bg-zim-red text-white text-[11px] px-6 py-2.5 rounded-full font-bold uppercase shadow-lg active:scale-95 transition-all">
                  <i className="fas fa-file-pdf mr-2"></i> Download PDF
                </button>
              </div>
              
              <div className="p-4 md:p-8 overflow-x-auto">
                <div className="border border-gray-300 p-4 md:p-8 min-w-[320px] bg-white text-[13px]">
                    <div className="text-center pb-4 mb-6 border-b">
                       <h2 className="text-sm font-bold uppercase tracking-widest">Detailed Lesson Plan</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-black border border-black mb-4">
                        <div className="bg-gray-50 p-2 font-bold uppercase text-[10px]">Date</div>
                        <div className="bg-white p-2">{generatedPlan.date}</div>
                        <div className="bg-gray-50 p-2 font-bold uppercase text-[10px]">Time</div>
                        <div className="bg-white p-2">{generatedPlan.duration} mins</div>
                        <div className="bg-gray-50 p-2 font-bold uppercase text-[10px]">Grade</div>
                        <div className="bg-white p-2">{generatedPlan.grade}</div>
                        <div className="bg-gray-50 p-2 font-bold uppercase text-[10px]">Subject</div>
                        <div className="bg-white p-2">{generatedPlan.subject}</div>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold text-black uppercase text-[10px] mb-1">Objectives:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                            {generatedPlan.objectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold text-black uppercase text-[10px] mb-1">Media:</h4>
                        <p className="text-xs text-gray-700">{generatedPlan.materials?.join(', ')}</p>
                    </div>

                    <div className="mb-6 overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse border border-black min-w-[500px]">
                          <thead>
                              <tr className="bg-gray-100 uppercase text-[9px]">
                                  <th className="border border-black p-2 text-left w-24">Stage</th>
                                  <th className="border border-black p-2 text-left">Activities</th>
                                  <th className="border border-black p-2 text-left w-32">Methods</th>
                              </tr>
                          </thead>
                          <tbody>
                              {generatedPlan.lessonSteps?.map((step, idx) => (
                              <tr key={idx}>
                                  <td className="border border-black p-2 font-bold align-top">{step.stage} ({step.time})</td>
                                  <td className="border border-black p-2 align-top">
                                      <p className="font-bold underline mb-1">Teacher:</p>
                                      <p className="mb-2">{step.teacherActivity}</p>
                                      <p className="font-bold underline mb-1">Learner:</p>
                                      <p>{step.learnerActivity}</p>
                                  </td>
                                  <td className="border border-black p-2 align-top italic">{step.methods}</td>
                              </tr>
                              ))}
                          </tbody>
                      </table>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-12 text-gray-400 min-h-[400px]">
              <i className="fas fa-edit text-4xl mb-4 opacity-20"></i>
              <p className="text-sm uppercase tracking-widest font-bold">No plan generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPlanner;