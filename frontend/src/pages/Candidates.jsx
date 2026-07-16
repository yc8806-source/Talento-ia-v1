import React, { useState, useEffect, useMemo } from 'react';
import { candidateAPI, vacancyAPI } from '../api/api';
import { FiSearch, FiPlus, FiFilter, FiChevronLeft, FiChevronRight, FiDownload, FiGitBranch } from 'react-icons/fi';
import BulkActionsModal from '../components/BulkActionsModal';

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cv: null,
    yearsExperience: 0,
    location: '',
    professionalSummary: '',
    salaryExpectation: '',
    availabilityDate: '',
    willingToTravel: false,
    linkedinUrl: '',
    githubUrl: '',
    skills: '',
    languages: '',
  });
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvFile, setCSVFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [candidateTokens, setCandidateTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [candidatesRes, vacanciesRes] = await Promise.all([
        candidateAPI.getAll(),
        vacancyAPI.getAll(),
      ]);
      setCandidates(candidatesRes.data.candidates);
      setVacancies(vacanciesRes.data.vacancies);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('createdBy', 1);
      data.append('yearsExperience', formData.yearsExperience);
      data.append('location', formData.location);
      data.append('professionalSummary', formData.professionalSummary);
      data.append('salaryExpectation', formData.salaryExpectation);
      data.append('availabilityDate', formData.availabilityDate);
      data.append('willingToTravel', formData.willingToTravel);
      data.append('linkedinUrl', formData.linkedinUrl);
      data.append('githubUrl', formData.githubUrl);
      data.append('skills', formData.skills);
      data.append('languages', formData.languages);
      if (formData.cv) {
        data.append('cv', formData.cv);
      }

      await candidateAPI.register(data);
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', cv: null,
        yearsExperience: 0, location: '', professionalSummary: '',
        salaryExpectation: '', availabilityDate: '', willingToTravel: false,
        linkedinUrl: '', githubUrl: '', skills: '', languages: ''
      });
      setShowForm(false);
      loadData();
      alert('Candidato registrado exitosamente');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'No se pudo registrar'));
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await candidateAPI.invite({
        candidateId: selectedCandidate.id,
        vacancyId: parseInt(selectedVacancy),
      });
      setInvitationToken(response.data.candidateVacancy.token);
      setShowTokenModal(true);
      setShowInviteForm(false);
      setSelectedCandidate(null);
      setSelectedVacancy('');
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'No se pudo invitar'));
    }
  };

  const handleViewTokens = async (candidate) => {
    setLoadingTokens(true);
    try {
      const response = await candidateAPI.getCandidateTokens(candidate.id);
      setCandidateTokens(response.data.tokens);
      setSelectedCandidate(candidate);
      setShowTokensModal(true);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'No se pudieron obtener los tokens'));
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    try {
      const data = new FormData();
      data.append('file', csvFile);
      data.append('createdBy', 1);

      await candidateAPI.importCSV(data);
      setCSVFile(null);
      setShowCSVImport(false);
      loadData();
      alert('Candidatos importados exitosamente');
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'No se pudo importar CSV'));
    }
  };

  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtro de estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidates, searchTerm, sortBy, filterStatus]);

  // Paginación
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-gray-600 mt-1">Gestiona y evalúa postulantes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkActionsModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FiGitBranch className="w-5 h-5" />
            Acciones Masivas
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            {showForm ? 'Cancelar' : 'Nuevo Candidato'}
          </button>
        </div>
      </div>

      {/* Modal de Acciones Masivas */}
      <BulkActionsModal
        isOpen={showBulkActionsModal}
        onClose={() => setShowBulkActionsModal(false)}
        onSuccess={() => {
          loadData();
          setShowBulkActionsModal(false);
        }}
      />

      {/* Formulario de Registro */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📝 Registrar Nuevo Candidato
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                CV (PDF o Word)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setFormData({ ...formData, cv: e.target.files?.[0] || null })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {formData.cv && (
                <p className="text-sm text-gray-600 mt-1">
                  ✓ {formData.cv.name}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              Registrar Candidato
            </button>
          </form>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="name">📌 Ordenar por Nombre</option>
            <option value="email">📧 Ordenar por Email</option>
            <option value="recent">📅 Más Recientes</option>
          </select>

          {/* Filtro de Estado */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">🔍 Todos los Estados</option>
            <option value="applicant">📄 Postulante</option>
            <option value="invited">💌 Invitado</option>
            <option value="completed">✅ Completado</option>
          </select>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Mostrando <span className="font-semibold">{filteredCandidates.length}</span> candidatos
        </p>
      </div>

      {/* Tabla de Candidatos */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-4">Cargando candidatos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {paginatedCandidates.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg">No hay candidatos {filterStatus !== 'all' ? 'en este estado' : 'registrados'}</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      CV
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {candidate.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {candidate.phone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {candidate.cvUrl ? (
                          <a
                            href={`http://localhost:3000${candidate.cvUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <FiDownload className="w-4 h-4" />
                            Descargar
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowInviteForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                          >
                            Invitar
                          </button>
                          <button
                            onClick={() => handleViewTokens(candidate)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                            title="Ver URL con token"
                          >
                            Ver URL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Siguiente
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Invitación */}
      {showInviteForm && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Invitar a Vacante
            </h2>
            <p className="text-gray-600 mb-4">
              {selectedCandidate.firstName} {selectedCandidate.lastName}
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Selecciona una vacante:
                </label>
                <select
                  value={selectedVacancy}
                  onChange={(e) => setSelectedVacancy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {vacancies.map((vac) => (
                    <option key={vac.id} value={vac.id}>
                      {vac.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                >
                  Invitar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setSelectedCandidate(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              ✓ Candidato Invitado
            </h2>
            <p className="text-gray-600 mb-4">
              Comparte este token con el postulante por WhatsApp o email:
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-4 break-all font-mono text-sm">
              {invitationToken}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(invitationToken);
                alert('Token copiado al portapapeles');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium mb-2"
            >
              Copiar Token
            </button>

            <button
              onClick={() => setShowTokenModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showTokensModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              URLs de {selectedCandidate.firstName} {selectedCandidate.lastName}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {selectedCandidate.email}
            </p>

            {loadingTokens ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
              </div>
            ) : candidateTokens.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">No hay URLs disponibles. Invita al candidato a una vacante primero.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {candidateTokens.map((tokenData, idx) => (
                  <div key={tokenData.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="mb-2">
                      <p className="font-medium text-gray-900">{tokenData.vacancyTitle}</p>
                      <p className="text-xs text-gray-500">
                        Estado: <span className="font-semibold">{tokenData.status}</span>
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-300 mb-2 break-all font-mono text-xs">
                      {tokenData.testUrl}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tokenData.testUrl);
                        alert('URL copiada al portapapeles');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium text-sm"
                    >
                      Copiar URL
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowTokensModal(false);
                setSelectedCandidate(null);
                setCandidateTokens([]);
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Candidates;
