"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, User, AlertCircle, CheckCircle, Search, Loader2, AlertTriangle, X, Shield, Users, CalendarDays, ChevronDown, ListX, Verified } from "lucide-react";
import { createSurgery, editSurgery, createCustomDiagnosis, createCustomProcedure, lookupProcedureInApi, lookupDiagnosisInApi } from "@/app/actions/cirugias";
import { useRouter } from "next/navigation";
import { lookupPatientByDni, createTemporaryPatient, lookupPatientsInApi } from "@/app/actions/pacientes";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const FieldError = ({ msg }: { msg?: string }) => {
    if (!msg) return null;
    return (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 dark:text-red-400 text-[11px] font-bold mt-1.5 flex items-center gap-1">
            <AlertCircle size={12} /> {msg}
        </motion.p>
    );
};

export function SurgerySchedulerForm({ salas, specialties, staff, canSchedule, diagnoses, procedures, interventions = [], patients, editMode, editData, isOpenOverride, onCloseOverride }: {
    salas: any[],
    specialties: any[],
    staff: { surgeons: any[], anesthesiologists: any[], nurses: any[] },
    canSchedule: boolean,
    diagnoses: any[],
    procedures: any[],
    interventions?: any[],
    patients: any[],
    editMode?: boolean,
    editData?: any,
    isOpenOverride?: boolean,
    onCloseOverride?: () => void
}) {
    const [patSearchTerm, setPatSearchTerm] = useState("");
    const router = useRouter();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = isOpenOverride !== undefined ? isOpenOverride : internalIsOpen;
    const handleClose = () => { if(onCloseOverride) onCloseOverride(); else setInternalIsOpen(false); };
    const [keepOpen, setKeepOpen] = useState(false);
    const [selectedPatId, setSelectedPatId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [apiDownPats, setApiDownPats] = useState(false);
    const [found, setFound] = useState<boolean | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [apiPatientData, setApiPatientData] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errorModalMsg, setErrorModalMsg] = useState<string>("");
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalType, setErrorModalType] = useState<'validation' | 'conflict'>('validation');
    const [dxSearchTerm, setDxSearchTerm] = useState("");
    const [selectedDxIds, setSelectedDxIds] = useState<Set<string>>(new Set());
    const [isSearchingDx, setIsSearchingDx] = useState(false);
    const [apiDownDx, setApiDownDx] = useState(false);
    const [procSearchTerm, setProcSearchTerm] = useState("");
    const [selectedProcIds, setSelectedProcIds] = useState<Set<string>>(new Set());
    const [isSearchingProc, setIsSearchingProc] = useState(false);
    const [apiDownProc, setApiDownProc] = useState(false);
    const [surgSearchTerm, setSurgSearchTerm] = useState("");
    const [selectedSurgIds, setSelectedSurgIds] = useState<Set<string>>(new Set());
    const [anesSearchTerm, setAnesSearchTerm] = useState("");
    const [selectedAnesIds, setSelectedAnesIds] = useState<Set<string>>(new Set());
    const [nursSearchTerm, setNursSearchTerm] = useState("");
    const [selectedNursIds, setSelectedNursIds] = useState<Set<string>>(new Set());

    const [intSearchTerm, setIntSearchTerm] = useState("");
    const [selectedIntIds, setSelectedIntIds] = useState<Set<string>>(new Set());

    // Cloning State
    const [clonedData, setClonedData] = useState<any>(null);
    const [formKey, setFormKey] = useState(0);

    // Accordion State Manager
    const [openSection, setOpenSection] = useState<'patient' | 'classification' | 'team' | 'schedule'>('patient');

    const [localPatients, setLocalPatients] = useState<any[]>(patients || []);
    const [localDiagnoses, setLocalDiagnoses] = useState<any[]>(diagnoses);
    const [localProcedures, setLocalProcedures] = useState<any[]>(procedures);
    const [localInterventions, setLocalInterventions] = useState<any[]>(interventions || []);
    const [isCreatingDx, setIsCreatingDx] = useState(false);
    const [isCreatingProc, setIsCreatingProc] = useState(false);
    const [isCreatingPat, setIsCreatingPat] = useState(false);
    const [manualPatientName, setManualPatientName] = useState("");

    useEffect(() => {
        setLocalPatients(prev => {
            const apiItems = prev.filter(p => !patients.find((dbItem: any) => dbItem.pii?.patientId === p.pii?.patientId || dbItem.pii?.dni === p.pii?.dni));
            return [...apiItems, ...(patients || [])];
        });
    }, [patients]);

    useEffect(() => {
        setLocalDiagnoses(prev => {
            const apiItems = prev.filter(p => !diagnoses.find((dbItem: any) => dbItem.id === p.id || dbItem.code === p.code));
            return [...apiItems, ...(diagnoses || [])];
        });
    }, [diagnoses]);

    useEffect(() => {
        setLocalProcedures(prev => {
            const apiItems = prev.filter(p => !procedures.find((dbItem: any) => dbItem.id === p.id || dbItem.code === p.code));
            return [...apiItems, ...(procedures || [])];
        });
    }, [procedures]);

    useEffect(() => {
        setLocalInterventions(prev => {
            const apiItems = prev.filter(p => !interventions.find((dbItem: any) => dbItem.id === p.id || dbItem.code === p.code));
            return [...apiItems, ...(interventions || [])];
        });
    }, [interventions]);

    useEffect(() => {
        if(editMode && editData) {
            setClonedData(editData);
            if (editData?.patientPii?.patientId) {
                setSelectedPatId(editData.patientPii.patientId);
                setPatSearchTerm(editData.patientPii.dni || editData.patientPii.historiaClinica || "");
            }
            if (editData?.team) {
                const surg = editData.team.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id);
                const anes = editData.team.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id);
                const nurs = editData.team.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id);
                setSelectedSurgIds(new Set(surg));
                setSelectedAnesIds(new Set(anes));
                setSelectedNursIds(new Set(nurs));
            }
            if (editData?.diagnoses && Object.keys(editData.diagnoses).length) setSelectedDxIds(new Set(editData.diagnoses));
            if (editData?.procedures && Object.keys(editData.procedures).length) setSelectedProcIds(new Set(editData.procedures));
            if (editData?.interventions && Object.keys(editData.interventions).length) setSelectedIntIds(new Set(editData.interventions));
            setFormKey(prev => prev + 1);
        }
    }, [editData, editMode]);

    const handleCreateDx = async () => {
        if (!dxSearchTerm) return;
        setIsCreatingDx(true);
        try {
            const newDx = await createCustomDiagnosis(dxSearchTerm);
            setLocalDiagnoses(prev => [newDx, ...prev]);
            setSelectedDxIds(prev => new Set([...Array.from(prev), newDx.id]));
            setDxSearchTerm("");
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingDx(false);
        }
    };

    const handleCreateProc = async () => {
        if (!procSearchTerm) return;
        setIsCreatingProc(true);
        try {
            const newProc = await createCustomProcedure(procSearchTerm);
            setLocalProcedures(prev => [newProc, ...prev]);
            setSelectedProcIds(prev => new Set([...Array.from(prev), newProc.id]));
            setProcSearchTerm("");
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingProc(false);
        }
    };

    const handleCreatePat = async () => {
        if (!patSearchTerm || !manualPatientName) return;
        setIsCreatingPat(true);
        try {
            const res = await createTemporaryPatient(patSearchTerm, manualPatientName);
            if (res.success) {
                // If it worked, we just try to fetch again or wait for revalidate.
                setPatSearchTerm(patSearchTerm);
                setManualPatientName("");
                setOpenSection("classification");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingPat(false);
        }
    };

    useEffect(() => {
        const handleClone = (e: any) => {
            const row = e.detail;
            setClonedData(row);
            
            // Sync Patient State
            if (row?.patientPii?.patientId) {
                setSelectedPatId(row.patientPii.patientId);
                setPatSearchTerm(row.patientPii.dni || "");
            }

            // Sync Staff Selection State
            const surg = row?.team?.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id) || [];
            const anes = row?.team?.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id) || [];
            const nurs = row?.team?.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id) || [];
            setSelectedSurgIds(new Set(surg));
            setSelectedAnesIds(new Set(anes));
            setSelectedNursIds(new Set(nurs));

            if (row?.diagnoses) Object.keys(row.diagnoses).length ? setSelectedDxIds(new Set(row.diagnoses)) : setSelectedDxIds(new Set());
            else setSelectedDxIds(new Set());
            
            if (row?.procedures) Object.keys(row.procedures).length ? setSelectedProcIds(new Set(row.procedures)) : setSelectedProcIds(new Set());
            else setSelectedProcIds(new Set());

            if (row?.interventions) Object.keys(row.interventions).length ? setSelectedIntIds(new Set(row.interventions)) : setSelectedIntIds(new Set());
            else setSelectedIntIds(new Set());

            setFormKey(prev => prev + 1); // Remount form with new defaultValues
            setInternalIsOpen(true); // Abre el modal visualmente para que el usuario proceda
            setOpenSection('patient');

            // Scroll to form smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        window.addEventListener('CLONE_SURGERY', handleClone);
        return () => window.removeEventListener('CLONE_SURGERY', handleClone);
    }, []);

    // Extract initial values for team arrays
    const initialSurgeons = clonedData?.team?.filter((t: any) => t.role === 'CIRUJANO').map((t: any) => t.staff.id) || [];
    const initialAnesthesiologists = clonedData?.team?.filter((t: any) => t.role === 'ANESTESIOLOGO').map((t: any) => t.staff.id) || [];
    const initialNurses = clonedData?.team?.filter((t: any) => t.role === 'ENFERMERO').map((t: any) => t.staff.id) || [];

    const toggleSection = (section: 'patient' | 'classification' | 'team' | 'schedule') => {
        setOpenSection(prev => prev === section ? prev : section);
    };

    const removeDiacritics = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // --- PATIENTS MULTIVARIABLE SEARCH ---
    const patSearchTermsArr = removeDiacritics(patSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedPatList = localPatients.filter(pat => pat.id === selectedPatId);
    const filteredUnselectedPat = localPatients
        .filter(pat => pat.id !== selectedPatId)
        .filter(pat => {
            if (patSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${pat.pii?.dni || ""} ${pat.pii?.nombres || ""} ${pat.pii?.apellidos || ""}`).toLowerCase();
            return patSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 15);

    const togglePat = (id: string, checked: boolean) => {
        if (checked) setSelectedPatId(id);
        else setSelectedPatId(null);
    };
    // ------------------------------------

    const searchTerms = removeDiacritics(dxSearchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    const selectedDxList = localDiagnoses.filter(dx => selectedDxIds.has(dx.id));
    const filteredUnselectedDx = localDiagnoses
        .filter(dx => !selectedDxIds.has(dx.id))
        .filter(dx => {
            if (searchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${dx.code || ""} ${dx.name}`.toLowerCase());
            return searchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleDx = (id: string, checked: boolean) => {
        const next = new Set(selectedDxIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedDxIds(next);
        document.getElementById('diagnoses-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const procSearchTerms = removeDiacritics(procSearchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    const selectedProcList = localProcedures.filter(proc => selectedProcIds.has(proc.id));
    const filteredUnselectedProc = localProcedures
        .filter(proc => !selectedProcIds.has(proc.id))
        .filter(proc => {
            if (procSearchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${proc.code || ""} ${proc.name}`.toLowerCase());
            return procSearchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleProc = (id: string, checked: boolean) => {
        const next = new Set(selectedProcIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedProcIds(next);
        document.getElementById('procedures-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const intSearchTerms = removeDiacritics(intSearchTerm.toLowerCase())
        .split(/\s+/)
        .filter(Boolean);

    const selectedIntList = localInterventions.filter(int => selectedIntIds.has(int.id));
    const filteredUnselectedInt = localInterventions
        .filter(int => !selectedIntIds.has(int.id))
        .filter(int => {
            if (intSearchTerms.length === 0) return true;
            const fullText = removeDiacritics(`${int.code || ""} ${int.name}`.toLowerCase());
            return intSearchTerms.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleInt = (id: string, checked: boolean) => {
        const next = new Set(selectedIntIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedIntIds(next);
        document.getElementById('interventions-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const surgSearchTermsArr = removeDiacritics(surgSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedSurgList = staff.surgeons.filter(s => selectedSurgIds.has(s.id));
    const filteredUnselectedSurg = staff.surgeons
        .filter(s => !selectedSurgIds.has(s.id))
        .filter(s => {
            if (surgSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${s.name} ${s.lastname} ${s.tuitionCode || ""}`).toLowerCase();
            return surgSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleSurg = (id: string, checked: boolean) => {
        const next = new Set(selectedSurgIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedSurgIds(next);
        document.getElementById('surgeons-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const anesSearchTermsArr = removeDiacritics(anesSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedAnesList = staff.anesthesiologists.filter(a => selectedAnesIds.has(a.id));
    const filteredUnselectedAnes = staff.anesthesiologists
        .filter(a => !selectedAnesIds.has(a.id))
        .filter(a => {
            if (anesSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${a.name} ${a.lastname} ${a.tuitionCode || ""}`).toLowerCase();
            return anesSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleAnes = (id: string, checked: boolean) => {
        const next = new Set(selectedAnesIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedAnesIds(next);
        document.getElementById('anesthesiologists-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const nursSearchTermsArr = removeDiacritics(nursSearchTerm.toLowerCase()).split(/\s+/).filter(Boolean);
    const selectedNursList = staff.nurses.filter(n => selectedNursIds.has(n.id));
    const filteredUnselectedNurs = staff.nurses
        .filter(n => !selectedNursIds.has(n.id))
        .filter(n => {
            if (nursSearchTermsArr.length === 0) return true;
            const fullText = removeDiacritics(`${n.name} ${n.lastname} ${n.professionName || ""}`).toLowerCase();
            return nursSearchTermsArr.every(term => fullText.includes(term));
        })
        .slice(0, 50);

    const toggleNurs = (id: string, checked: boolean) => {
        const next = new Set(selectedNursIds);
        if (checked) next.add(id);
        else next.delete(id);
        setSelectedNursIds(next);
        document.getElementById('nurses-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        // Premium UX/UI Frontend Validation
        let newErrors: Record<string, string> = {};
        let firstErrorSection: 'patient' | 'classification' | 'team' | 'schedule' | null = null;
        let firstErrorField: string | null = null;

        const setError = (field: string, msg: string, section: any) => {
            newErrors[field] = msg;
            if (!firstErrorSection) {
                firstErrorSection = section;
                firstErrorField = field;
            }
        };

        if (!selectedPatId && !patSearchTerm) setError('patient_id', "Falta identificador", 'patient');
        if (selectedDxIds.size === 0) setError('diagnoses', "Selecciona al menos un diagnóstico", 'patient');
        if (selectedIntIds.size === 0) setError('interventions', "Selecciona al menos una intervención", 'patient');
        if (!formData.get("surgery_type")) setError('surgery_type', "Requerido", 'classification');
        if (!formData.get("urgency_type")) setError('urgency_type', "Requerido", 'classification');
        if (!formData.get("specialty_id")) setError('specialty_id', "Requerido", 'classification');
        if (!formData.get("origin")) setError('origin', "Requerido", 'classification');
        if (!formData.get("insurance_type")) setError('insurance_type', "Requerido", 'classification');
        if (selectedSurgIds.size === 0) setError('surgeons', "Asigna al menos un cirujano", 'team');
        if (editMode && !formData.get("operating_room_id")) setError('operating_room_id', "Requerido", 'schedule');
        if (!formData.get("scheduled_date")) setError('scheduled_date', "Requerido", 'schedule');
        if (editMode && !formData.get("scheduled_time")) setError('scheduled_time', "Requerido", 'schedule');
        if (!formData.get("estimated_duration")) setError('estimated_duration', "Requerido", 'schedule');

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            if (firstErrorSection) setOpenSection(firstErrorSection);
            
            // Allow accordion to open dynamically before searching for the element and scrolling smoothly
            setTimeout(() => {
                const els = document.getElementsByName(firstErrorField || "");
                if (els.length > 0) {
                    const el = els[0] as HTMLElement;
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                    
                    // Add a highly visible rapid blinking/pulsating red shadow
                    el.classList.add('animate-pulse', 'ring-4', 'ring-red-500', 'border-red-600');
                    setTimeout(() => {
                        el.classList.remove('animate-pulse', 'ring-4', 'ring-red-500', 'border-red-600');
                    }, 2500);
                }
            }, 350);
            return;
        }

        setSubmitting(true);

        const res = editMode ? await editSurgery(formData) : await createSurgery(formData);

        if (res?.error) {
            setErrorModalType('conflict');
            setErrorModalMsg(res.error);
            setIsErrorModalOpen(true);
        } else {
            form.reset();
            setPatSearchTerm("");
            setSelectedPatId(null);
            setSelectedDxIds(new Set());
            setDxSearchTerm("");
            setSelectedProcIds(new Set());
            setProcSearchTerm("");
            setSelectedIntIds(new Set());
            setIntSearchTerm("");
            setSelectedSurgIds(new Set());
            setSurgSearchTerm("");
            setSelectedAnesIds(new Set());
            setAnesSearchTerm("");
            setSelectedNursIds(new Set());
            setNursSearchTerm("");
            setOpenSection('patient'); // reset accordion
            
            if (!keepOpen || editMode) {
                handleClose();
            }
            router.refresh();
        }
        setSubmitting(false);
    };

    // Debounce the DNI search against ApiNetHos
    useEffect(() => {
        if (patSearchTerm.trim().length >= 3) { // Search API if length >= 3
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                const resArray = await lookupPatientsInApi(patSearchTerm.trim());
                if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                    if (resArray[0]?.__apiError) {
                        setApiDownPats(true);
                    } else {
                        setApiDownPats(false);
                        setLocalPatients(prev => {
                            const newPats = resArray.filter(
                                (apiPat: any) => !prev.find(p => p.pii?.dni === apiPat.pii.dni)
                            );
                            return [...newPats, ...prev];
                        });
                    }
                } else {
                    setApiDownPats(false);
                }
                setIsSearching(false);
            }, 1000);
            return () => clearTimeout(timeoutId);
        } else {
            setIsSearching(false);
        }
    }, [patSearchTerm]);

    // Debounce the Diagnosis search against ApiNetHos
    useEffect(() => {
        if (dxSearchTerm.trim().length >= 3) {
            setIsSearchingDx(true);
            const timeoutId = setTimeout(async () => {
                const resArray = await lookupDiagnosisInApi(dxSearchTerm.trim());
                if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                    if (resArray[0]?.__apiError) {
                        setApiDownDx(true);
                        resArray.shift(); // Remove error object to show any fallback local results
                    } else {
                        setApiDownDx(false);
                    }
                    if (resArray.length > 0) {
                        setLocalDiagnoses(prev => {
                            const newDiagnoses = resArray.filter(
                                (apiDx: any) => !prev.find(d => d.code === apiDx.code)
                            );
                            return [...newDiagnoses, ...prev];
                        });
                    }
                } else {
                    setApiDownDx(false);
                }
                setIsSearchingDx(false);
            }, 1000);
            return () => clearTimeout(timeoutId);
        } else {
            setIsSearchingDx(false);
        }
    }, [dxSearchTerm]);

    // Debounce the Procedure search against ApiNetHos
    useEffect(() => {
        if (procSearchTerm.trim().length >= 3) {
            setIsSearchingProc(true);
            const timeoutId = setTimeout(async () => {
                const resArray = await lookupProcedureInApi(procSearchTerm.trim());
                if (resArray && Array.isArray(resArray) && resArray.length > 0) {
                    if (resArray[0]?.__apiError) {
                        setApiDownProc(true);
                        resArray.shift();
                    } else {
                        setApiDownProc(false);
                    }
                    if (resArray.length > 0) {
                        setLocalProcedures(prev => {
                            const newProcedures = resArray.filter(
                                (apiProc: any) => !prev.find(p => p.code === apiProc.code)
                            );
                            return [...newProcedures, ...prev];
                        });
                    }
                } else {
                    setApiDownProc(false);
                }
                setIsSearchingProc(false);
            }, 1000);
            return () => clearTimeout(timeoutId);
        } else {
            setIsSearchingProc(false);
        }
    }, [procSearchTerm]);

    const baseInput = "w-full px-4 py-2 border rounded-xl outline-none transition-all disabled:opacity-50 text-sm";
    const getInputCls = (field: string, extra: string = "") => {
        const isErr = !!errors[field];
        const normal = "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[var(--color-hospital-blue)] focus:border-transparent";
        const err = "border-red-500 ring-4 ring-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-100 placeholder:text-red-400 focus:ring-red-500 focus:border-red-500";
        return `${baseInput} ${isErr ? err : normal} ${extra}`;
    };
    const getSelectCls = (field: string, extra: string = "") => {
        return `${getInputCls(field, extra)} appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2371717A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[position:right_1rem_center]`;
    };
    
    // Fallback handlers for inputs without explicit errors initially mapped
    const inputClasses = getInputCls("");
    const selectClasses = getSelectCls("");
    
    // Also a helper for containers (like empty checkboxes areas)
    const getContainerErrCls = (field: string) => errors[field] ? "border border-red-500 ring-4 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border border-zinc-200 dark:border-zinc-700";

    return (
        <>
            {/* Botón flotante superior (en la página se colocará junto al título) */}
            <button
                type="button"
                onClick={() => setInternalIsOpen(true)}
                className="flex items-center text-sm font-semibold justify-center py-2.5 px-6 rounded-xl shadow-[0_2px_12px_rgba(33,121,202,0.3)] text-white bg-[var(--color-hospital-blue)] hover:bg-[#09357a] hover:shadow-[0_6px_20px_rgba(33,121,202,0.4)] transition-all uppercase tracking-wider gap-2 shrink-0"
            >
                <Plus size={18} /> Nueva Cirugía
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleClose()}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-[96vw] max-w-[1600px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[95vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-3xl shrink-0">
                                <div>
                                    <h3 className="font-bold text-xl text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Plus size={24} className="text-[var(--color-hospital-blue)] dark:text-blue-400" /> {editMode ? "Actualizar Cirugía" : "Registrar Cirugía"}
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1 font-medium">{editMode ? "Verifica y actualiza la planificacion pre-operatoria" : "Completa los datos preoperatorios y asigna el equipo quirúrgico."}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleClose()}
                                    className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-3">
            
            {!canSchedule && (
                <div className="mb-5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-xl border border-amber-200 dark:border-amber-800/50 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center font-semibold">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        Bloque Quirúrgico Lleno
                    </div>
                    <p className="pl-7 text-amber-700/80 dark:text-amber-300/80">No hay salas operativas disponibles para esta fecha. Espera su liberación.</p>
                </div>
            )}
            {clonedData && (
                <div className="mb-5 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-hospital-blue)] dark:text-blue-300 text-sm rounded-xl border border-blue-200 dark:border-blue-800/50 flex flex-col gap-1 shadow-sm font-semibold">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        Modo Clonación Activo
                    </div>
                    <p className="pl-7 text-xs opacity-90 font-medium">Se han precargado los datos. Selecciona una nueva fecha y sala.</p>
                </div>
            )}

            <form key={formKey} onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* --- SECCIÓN 1: PACIENTE & DIAGNÓSTICO --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('patient')}
                        className={`w-full flex items-center justify-between p-4 text-left font-bold tracking-wide transition-all ${openSection === 'patient' ? 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-700 dark:border-l-blue-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${openSection === 'patient' ? 'bg-blue-100 dark:bg-blue-900/40 text-[var(--color-hospital-blue)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                <User size={18} />
                            </div>
                            <span className="text-sm">1. Detalle del Paciente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className={`transition-transform duration-300 ${openSection === 'patient' ? 'rotate-180 text-[var(--color-hospital-blue)]' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'patient' ? 'auto' : 0, opacity: openSection === 'patient' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Paciente (DNI / HC)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        disabled={!canSchedule}
                                        value={patSearchTerm}
                                        onChange={(e) => setPatSearchTerm(e.target.value)}
                                        className={getInputCls("patient_id", "pl-4 pr-10")}
                                        placeholder="Filtrar variables (DNI o Nombres)"
                                    />
                                    {/* HIDDEN INPUT FOR SUBMISSION */}
                                    <input type="hidden" name="patient_uuid" value={selectedPatId || (editMode ? editData?.patientPii?.patientId : "") || ""} />
                                    <input type="hidden" name="patient_dni" value={patSearchTerm || ""} />
                                    <input type="hidden" name="api_patient_data" value={selectedPatList[0]?.apiData || ""} />
                                    {editMode && <input type="hidden" name="id" value={editData?.surgery?.id || ""} />}
                                    
                                    <div className="absolute right-3 top-2.5 flex items-center">
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-[var(--color-hospital-blue)]" /> : <Search className="h-4 w-4 text-zinc-400" />}
                                    </div>
                                </div>

                                <div className={`mt-2 border rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all ${
                                    selectedPatId ? "border-[var(--color-hospital-blue)] ring-2 ring-blue-500/20" : "border-zinc-200 dark:border-zinc-800"
                                }`}>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
                                        <span>Motor PIDE - Resultados</span>
                                        {selectedPatId && <span className="text-[var(--color-hospital-blue)]">Paciente Seleccionado</span>}
                                    </div>
                                    <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {selectedPatList.map((pat) => (
                                            <label key={pat.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedPatId === pat.id}
                                                    onChange={(e) => togglePat(pat.id, e.target.checked)}
                                                    className="mt-0.5 rounded border-zinc-300 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)]"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">
                                                        {pat.pii?.nombres} {pat.pii?.apellidos}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{pat.pii?.dni || 'S/DNI'}</span>
                                                        {pat.id && pat.id.startsWith('__api') ? (
                                                            <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                        ) : (
                                                            <span className="flex items-center text-[10px] uppercase font-bold text-blue-500 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}

                                        {filteredUnselectedPat.map((pat) => (
                                            <label key={pat.id} className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedPatId === pat.id}
                                                    onChange={(e) => togglePat(pat.id, e.target.checked)}
                                                    className="mt-0.5 rounded border-zinc-300 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)]"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">
                                                        {pat.pii?.nombres} {pat.pii?.apellidos}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{pat.pii?.dni || 'S/DNI'}</span>
                                                        {pat.id && pat.id.startsWith('__api') ? (
                                                            <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                        ) : (
                                                            <span className="flex items-center text-[10px] uppercase font-bold text-zinc-500 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                        
                                        {patSearchTerm && filteredUnselectedPat.length === 0 && selectedPatList.length === 0 && !isSearching && (
                                            <div className="p-4 text-center text-xs text-zinc-500 font-medium flex flex-col items-center">
                                                <User size={24} className="text-zinc-300 mb-2" />
                                                Ningún paciente coincide con "{patSearchTerm}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {selectedPatId && (
                                    <input 
                                        type="hidden" 
                                        name="patient_id" 
                                        value={selectedPatList[0]?.pii?.dni || selectedPatId.replace('__api_pat__', '')} 
                                    />
                                )}
                                <FieldError msg={errors.patient_id} />
                                
                                {apiDownPats && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-2 font-bold uppercase tracking-wider overflow-hidden">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Servidor API no accesible. Solo se realizó búsqueda en base de datos local.</span>
                                    </motion.div>
                                )}
                            </div>

                                                        {/* Action button to continue */}
                            <div className="pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('classification')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- SECCIÓN 2: CLASIFICACIÓN & SEGURO --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('classification')}
                        className={`w-full flex items-center justify-between p-4 text-left font-bold tracking-wide transition-all ${openSection === 'classification' ? 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-700 dark:border-l-blue-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${openSection === 'classification' ? 'bg-blue-100 dark:bg-blue-900/40 text-[var(--color-hospital-blue)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                <Shield size={18} />
                            </div>
                            <span className="text-sm">2. Clasificación Clínica</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className={`transition-transform duration-300 ${openSection === 'classification' ? 'rotate-180 text-[var(--color-hospital-blue)]' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'classification' ? 'auto' : 0, opacity: openSection === 'classification' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 border-t border-zinc-100 dark:border-zinc-800/60">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tipo Operación</label>
                                    <select name="surgery_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.surgeryType || ""} className={getSelectCls("surgery_type")}>
                                        <option value="">- Tipo -</option>
                                        <option value="Cirugía Menor">Cirugía Menor</option>
                                        <option value="Cirugía Mayor">Cirugía Mayor</option>
                                    </select>
                                    <FieldError msg={errors.surgery_type} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Prioridad</label>
                                    <select name="urgency_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.urgencyType || "ELECTIVO"} className={getSelectCls("urgency_type")}>
                                        <option value="ELECTIVO">Electivo</option>
                                        <option value="EMERGENCIA">Emergencia</option>
                                    </select>
                                    <FieldError msg={errors.urgency_type} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Especialidad</label>
                                    <select name="specialty_id" disabled={!canSchedule} defaultValue={clonedData?.surgery?.specialtyId || ""} className={getSelectCls("specialty_id")}>
                                        <option value="">- Seleccionar -</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                    <FieldError msg={errors.specialty_id} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tipo de seguro</label>
                                    <select name="insurance_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.insuranceType || ""} className={getSelectCls("insurance_type")}>
                                        <option value="">- Seguro -</option>
                                        <option value="SIS">SIS</option>
                                        <option value="SOAT">SOAT</option>
                                        <option value="PARTICULAR">PARTICULAR</option>
                                        <option value="SISPOL">SISPOL</option>
                                    </select>
                                    <FieldError msg={errors.insurance_type} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Procedencia</label>
                                    <input
                                        type="text"
                                        name="origin"
                                        disabled={!canSchedule}
                                        defaultValue={clonedData?.surgery?.origin || ""}
                                        placeholder="Ej. Ambulatorio"
                                        className={getInputCls("origin")}
                                    />
                                    <FieldError msg={errors.origin} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tipo de Anestesia</label>
                                    <select name="anesthesia_type" disabled={!canSchedule} defaultValue={clonedData?.surgery?.anesthesiaType || ""} className={getSelectCls("anesthesia_type")}>
                                        <option value="">- Seleccionar Anestesia -</option>
                                    <option value="RAQ">RAQ - Raquídea (o Subaracnoidea)</option>
                                    <option value="EPI">EPI - Epidural</option>
                                    <option value="AGB">AGB - Anestesia General Balanceada</option>
                                    <option value="AGE">AGE - Anestesia General Endovenosa</option>
                                    <option value="AGI">AGI - Anestesia General Inhalatoria</option>
                                    <option value="BLOQ">BLOQ - Bloqueo Regional</option>
                                    <option value="LOCL">LOCL - Local</option>
                                </select>
                                <FieldError msg={errors.anesthesia_type} />
                            </div>

                            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 pt-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Diagnósticos (Dx)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar patología por código CIE o nombre..."
                                        value={dxSearchTerm}
                                        onChange={e => setDxSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    {isSearchingDx ? (
                                        <Loader2 className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                    )}
                                </div>
                                <div id="diagnoses-list" className={`max-h-52 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("diagnoses")}`}>
                                    {selectedDxList.map((dx) => (
                                        <label key={dx.id} className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="diagnoses"
                                                value={dx.id}
                                                checked={true}
                                                onChange={(e) => toggleDx(dx.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{dx.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{dx.code || 'S/C'}</span>
                                                    {dx.id.startsWith('__api') ? (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-[var(--color-hospital-blue)] gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedDx.map((dx) => (
                                        <label key={dx.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="diagnoses"
                                                value={dx.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleDx(dx.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{dx.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{dx.code || 'S/C'}</span>
                                                    {dx.id && dx.id.startsWith('__api') ? (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-blue-500 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedDx.length === 0 && selectedDxList.length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-zinc-500 mb-2">No se encontraron diagnósticos que coincidan con la búsqueda.</p>
                                            {dxSearchTerm && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleCreateDx} 
                                                    disabled={isCreatingDx || !canSchedule}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[11px] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-1 shadow-sm uppercase tracking-wider"
                                                >
                                                    {isCreatingDx ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                    ✨ Añadir rápidamente "{dxSearchTerm}" al sistema
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {diagnoses.length > 0 && filteredUnselectedDx.length === 50 && (
                                        <p className="text-[10px] text-zinc-400 p-2 text-center uppercase tracking-widest font-bold">Mostrando los primeros 50 resultados. Continúa escribiendo para afinar.</p>
                                    )}
                                </div>
                                <FieldError msg={errors.diagnoses} />
                                
                                {apiDownDx && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-2 font-bold uppercase tracking-wider overflow-hidden">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Servidor API no accesible. Solo se realizó búsqueda en base de datos local.</span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="space-y-2 pt-2 hidden">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Catálogo de Procedimientos (Opcional)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar procedimiento por código o nombre..."
                                        value={procSearchTerm}
                                        onChange={e => setProcSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    {isSearchingProc ? (
                                        <Loader2 className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                    )}
                                </div>
                                <div id="procedures-list" className={`max-h-52 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("procedures")}`}>
                                    {selectedProcList.map((proc) => (
                                        <label key={proc.id} className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="procedures"
                                                value={proc.id}
                                                checked={true}
                                                onChange={(e) => toggleProc(proc.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{proc.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{proc.code || 'S/C'}</span>
                                                    {proc.id.startsWith('__api') ? (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-[var(--color-hospital-blue)] gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedProc.map((proc) => (
                                        <label key={proc.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="procedures"
                                                value={proc.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleProc(proc.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{proc.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{proc.code || 'S/C'}</span>
                                                    {proc.id && proc.id.startsWith('__api') ? (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 gap-0.5"><Verified size={10} /> MINSA PIDE</span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] uppercase font-bold text-blue-500 gap-0.5"><CheckCircle size={10} /> REGISTRADO</span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedProc.length === 0 && selectedProcList.length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-zinc-500 mb-2">No se encontraron procedimientos que coincidan con la búsqueda.</p>
                                            {procSearchTerm && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleCreateProc} 
                                                    disabled={isCreatingProc || !canSchedule}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-[11px] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-1 shadow-sm uppercase tracking-wider"
                                                >
                                                    {isCreatingProc ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                    ✨ Añadir rápidamente "{procSearchTerm}" al sistema
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {procedures.length > 0 && filteredUnselectedProc.length === 50 && (
                                        <p className="text-[10px] text-zinc-400 p-2 text-center uppercase tracking-widest font-bold">Mostrando los primeros 50 resultados.</p>
                                    )}
                                </div>
                                <FieldError msg={errors.procedures} />
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Tipo de Intervención</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo de intervención..."
                                        value={intSearchTerm}
                                        onChange={e => setIntSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div id="interventions-list" className={`max-h-52 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("interventions")}`}>
                                    {selectedIntList.map((inty) => (
                                        <label key={inty.id} className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="interventions"
                                                value={inty.id}
                                                checked={true}
                                                onChange={(e) => toggleInt(inty.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-zinc-300 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{inty.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{inty.code}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedInt.map((inty) => (
                                        <label key={inty.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="interventions"
                                                value={inty.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleInt(inty.id, e.target.checked)}
                                                className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-zinc-300 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed">{inty.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-700">{inty.code}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredUnselectedInt.length === 0 && selectedIntList.length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-zinc-500 mb-2">No se encontraron intervenciones que coincidan con la búsqueda.</p>
                                        </div>
                                    )}
                                </div>
                                <FieldError msg={errors.interventions} />

                                {apiDownProc && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-2 font-bold uppercase tracking-wider overflow-hidden">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>Servidor API no accesible. Solo se realizó búsqueda en base de datos local.</span>
                                    </motion.div>
                                )}
                            </div>
                            </div>


                            <div className="col-span-full pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('team')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- SECCIÓN 3: AGENDA Y SALA --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('schedule')}
                        className={`w-full flex items-center justify-between p-4 text-left font-bold tracking-wide transition-all ${openSection === 'schedule' ? 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-700 dark:border-l-blue-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${openSection === 'schedule' ? 'bg-blue-100 dark:bg-blue-900/40 text-[var(--color-hospital-blue)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                <CalendarDays size={18} />
                            </div>
                            <span className="text-sm">3. Sala y Horarios</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className={`transition-transform duration-300 ${openSection === 'schedule' ? 'rotate-180 text-[var(--color-hospital-blue)]' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'schedule' ? 'auto' : 0, opacity: openSection === 'schedule' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-4 space-y-4 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Sala Quirúrgica</label>
                                    <select name="operating_room_id" disabled={!canSchedule} defaultValue={clonedData?.surgery?.operatingRoomId || ""} className={getSelectCls("operating_room_id")}>
                                        <option value="">-- Por definir internamente --</option>
                                        {salas.filter(s => s.status === 'available' || (editMode && clonedData?.surgery?.operatingRoomId === s.id)).map(sala => (
                                            <option key={sala.id} value={sala.id}>{sala.name}</option>
                                        ))}
                                    </select>
                                    <FieldError msg={errors.operating_room_id} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Fecha de Solicitud</label>
                                    <input type="date" name="request_date" required disabled={!canSchedule} 
                                           defaultValue={clonedData?.surgery?.requestDate ? format(new Date(clonedData.surgery.requestDate + 'T00:00:00'), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} 
                                           className={getInputCls("request_date")} 
                                    />
                                    <FieldError msg={errors.request_date} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Fecha Programación</label>
                                    <input type="date" name="scheduled_date" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.scheduledDate ? format(new Date(clonedData.surgery.scheduledDate), 'yyyy-MM-dd') : ""} className={getInputCls("scheduled_date")} />
                                    <FieldError msg={errors.scheduled_date} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Hora</label>
                                    <input type="time" name="scheduled_time" required={!!editMode} disabled={!canSchedule} defaultValue={clonedData?.surgery?.scheduledDate ? format(new Date(clonedData.surgery.scheduledDate), 'HH:mm') : ""} className={getInputCls("scheduled_time")} />
                                    <FieldError msg={errors.scheduled_time} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Duración Estimada</label>
                                    <select name="estimated_duration" required disabled={!canSchedule} defaultValue={clonedData?.surgery?.estimatedDuration || ""} className={getSelectCls("estimated_duration", "px-2")}>
                                        <option value="">- Lapso -</option>
                                        <option value="30 minutos">30 min (Exp.)</option>
                                        <option value="1 hora">1 hora o menos</option>
                                        <option value="2 horas">Hasta 2 horas</option>
                                        <option value="3 horas">Hasta 3 horas</option>
                                        <option value="4+ horas">4 horas a más</option>
                                    </select>
                                    <FieldError msg={errors.estimated_duration} />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Notas Internas</label>
                                <textarea
                                    name="notes"
                                    disabled={!canSchedule}
                                    defaultValue={clonedData?.surgery?.notes || ""}
                                    className={getInputCls("", "resize-none h-20")}
                                    placeholder="Procedimiento, insumos especiales o materiales médicos (Opcional)..."
                                ></textarea>
                            </div>

                        </div>
                    </motion.div>
                </div>


                {/* --- SECCIÓN 4: EQUIPO ASISTENCIAL --- */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
                    <button
                        type="button"
                        onClick={() => toggleSection('team')}
                        className={`w-full flex items-center justify-between p-4 text-left font-bold tracking-wide transition-all ${openSection === 'team' ? 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-700 dark:border-l-blue-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${openSection === 'team' ? 'bg-blue-100 dark:bg-blue-900/40 text-[var(--color-hospital-blue)]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                <Users size={18} />
                            </div>
                            <span className="text-sm">4. Equipo Asistencial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChevronDown size={18} className={`transition-transform duration-300 ${openSection === 'team' ? 'rotate-180 text-[var(--color-hospital-blue)]' : ''}`} />
                        </div>
                    </button>

                    <motion.div
                        initial={false}
                        animate={{ height: openSection === 'team' ? 'auto' : 0, opacity: openSection === 'team' ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-100 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Cirujano(s) Principal(es)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido o CMP..."
                                        value={surgSearchTerm}
                                        onChange={e => setSurgSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div id="surgeons-list" className={`max-h-40 overflow-y-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1 ${getContainerErrCls("surgeons")}`}>
                                    {selectedSurgList.map((s) => (
                                        <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="surgeons"
                                                value={s.id}
                                                checked={true}
                                                onChange={(e) => toggleSurg(s.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{s.name} {s.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">({s.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedSurg.map((s) => (
                                        <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="surgeons"
                                                value={s.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleSurg(s.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{s.name} {s.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">({s.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedSurg.length === 0 && selectedSurgList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron cirujanos.</p>
                                    )}
                                </div>
                                <FieldError msg={errors.surgeons} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Anestesiólogo(s)</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o apellido..."
                                        value={anesSearchTerm}
                                        onChange={e => setAnesSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedAnesList.map((a) => (
                                        <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="anesthesiologists"
                                                value={a.id}
                                                checked={true}
                                                onChange={(e) => toggleAnes(a.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{a.name} {a.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">({a.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedAnes.map((a) => (
                                        <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="anesthesiologists"
                                                value={a.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleAnes(a.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{a.name} {a.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">({a.tuitionCode})</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedAnes.length === 0 && selectedAnesList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron anestesiólogos.</p>
                                    )}
                                </div>
                            </div>


                            <div className="space-y-2">
                                <label className="text-[11px] font-normal text-blue-600 dark:text-blue-400 uppercase tracking-widest">Circulante / Intensivista</label>
                                <div className="relative mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, apellido o rol..."
                                        value={nursSearchTerm}
                                        onChange={e => setNursSearchTerm(e.target.value)}
                                        className={getInputCls("", "pl-9 py-2")}
                                        disabled={!canSchedule}
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                                </div>
                                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                                    {selectedNursList.map((n) => (
                                        <label key={n.id} className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer cursor-allowed text-sm border border-blue-100 dark:border-blue-800/50">
                                            <input
                                                type="checkbox"
                                                name="nurses"
                                                value={n.id}
                                                checked={true}
                                                onChange={(e) => toggleNurs(n.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-[var(--color-hospital-blue)] dark:text-blue-400">{n.name} {n.lastname}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 text-xs flex-1 truncate font-medium">{n.professionName}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedNurs.map((n) => (
                                        <label key={n.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer cursor-allowed disabled:opacity-50 text-sm">
                                            <input
                                                type="checkbox"
                                                name="nurses"
                                                value={n.id}
                                                checked={false}
                                                disabled={!canSchedule}
                                                onChange={(e) => toggleNurs(n.id, e.target.checked)}
                                                className="w-4 h-4 text-[var(--color-hospital-blue)] rounded border-zinc-300 focus:ring-[var(--color-hospital-blue)] dark:border-zinc-600 dark:bg-zinc-700"
                                            />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{n.name} {n.lastname}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-1 truncate">{n.professionName}</span>
                                        </label>
                                    ))}
                                    {filteredUnselectedNurs.length === 0 && selectedNursList.length === 0 && (
                                        <p className="text-sm text-zinc-500 p-4 text-center">No se encontraron enfermeros.</p>
                                    )}
                                </div>
                            </div>


                            <div className="pt-2 flex justify-end">
                                <button type="button" onClick={() => toggleSection('schedule')} className="text-sm font-semibold text-[var(--color-hospital-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-colors">Siguiente Paso &rarr;</button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Actions */}
                <div className={`pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-4 ${editMode ? 'justify-end' : 'justify-between'}`}>
                    {!editMode && (
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={keepOpen} 
                                onChange={(e) => setKeepOpen(e.target.checked)} 
                                className="w-4 h-4 rounded border-zinc-300 text-[var(--color-hospital-blue)] focus:ring-[var(--color-hospital-blue)]"
                            />
                            <span className="text-sm font-normal text-blue-600 dark:text-blue-400 transition-colors select-none">Mantener ventana abierta</span>
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={!canSchedule || submitting}
                        className="group relative flex justify-center py-3.5 px-8 rounded-xl shadow-md text-sm font-normal text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200 overflow-hidden w-full sm:w-auto ml-auto"
                    >
                        <div className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        <span className="relative">{submitting ? (editMode ? "Actualizando..." : "Aprobando Agenda...") : (editMode ? "Guardar Cambios" : "Confirmar Cirugía")}</span>
                    </button>
                </div>
            </form>
            
            </div>
            </motion.div>
            </div>
            )}
            </AnimatePresence>

            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isErrorModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setIsErrorModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 max-w-sm w-full relative whitespace-pre-wrap text-left"
                            >
                                <button
                                    onClick={() => setIsErrorModalOpen(false)}
                                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${errorModalType === 'validation' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                        {errorModalType === 'validation' ? <ListX size={24} /> : <AlertTriangle size={24} />}
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                        {errorModalType === 'validation' ? 'Formulario Incompleto' : (
                                            errorModalMsg.includes('Cruce') || errorModalMsg.includes('horarios') || errorModalMsg.includes('sala') 
                                                ? 'Cruce de Horarios Detectado' 
                                                : (errorModalMsg.includes('Falta') || errorModalMsg.includes('obligatorio') ? 'Datos Incompletos' : 'Error de Sistema')
                                        )}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-left w-full mt-2">
                                        {errorModalMsg}
                                    </p>

                                    <button
                                        onClick={() => setIsErrorModalOpen(false)}
                                        className="w-full py-2.5 px-4 rounded-xl font-semibold text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-sm transition-colors"
                                    >
                                        Corregir Datos
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}






