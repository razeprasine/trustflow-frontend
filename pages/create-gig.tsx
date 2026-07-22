import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Navbar } from '../components/organisms'
import { useGlobalToast } from './_app'
import { useWallet } from '../hooks'
import { createGigEscrow, isValidStellarAddress } from '../shared/escrow-contract'

interface Milestone {
  id: string
  title: string
  description: string
  amount: string
  duration: string
}

interface FormData {
  title: string
  description: string
  category: string
  totalBudget: string
  /** The freelancer's Stellar address; the escrow contract requires a beneficiary up front. */
  beneficiaryAddress: string
  milestones: Milestone[]
}

const CATEGORIES = ['Development', 'Design', 'Writing', 'Marketing', 'Other']

const STEPS = ['Basic Info', 'Milestones', 'Review & Submit']

const CreateGig: NextPage = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'Development',
    totalBudget: '',
    beneficiaryAddress: '',
    milestones: [{ id: '1', title: '', description: '', amount: '', duration: '' }],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useGlobalToast()
  const router = useRouter()
  const { account, signTransaction } = useWallet()

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        { id: Date.now().toString(), title: '', description: '', amount: '', duration: '' },
      ],
    })
  }

  const removeMilestone = (id: string) => {
    if (formData.milestones.length > 1) {
      setFormData({
        ...formData,
        milestones: formData.milestones.filter((m) => m.id !== id),
      })
    }
  }

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    })
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 0) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (!formData.totalBudget || Number(formData.totalBudget) <= 0) {
        newErrors.totalBudget = 'Valid budget is required'
      }
      if (!formData.beneficiaryAddress.trim()) {
        newErrors.beneficiaryAddress = "Freelancer's wallet address is required"
      } else if (!isValidStellarAddress(formData.beneficiaryAddress.trim())) {
        newErrors.beneficiaryAddress = 'Enter a valid Stellar address (starts with G)'
      }
    }

    if (currentStep === 1) {
      formData.milestones.forEach((m, idx) => {
        if (!m.title.trim()) newErrors[`milestone-${idx}-title`] = 'Milestone title required'
        if (!m.amount || Number(m.amount) <= 0) {
          newErrors[`milestone-${idx}-amount`] = 'Valid amount required'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    if (!account) {
      toast.error('Connect your Stellar wallet before creating a gig')
      return
    }

    setIsSubmitting(true)
    try {
      const { escrowId } = await createGigEscrow(
        {
          depositor: account.address,
          beneficiary: formData.beneficiaryAddress.trim(),
          milestones: formData.milestones.map((m) => ({
            label: m.title,
            amount: m.amount,
          })),
        },
        signTransaction
      )

      toast.success(`Gig created and escrow #${escrowId} funded successfully!`)
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create gig escrow'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Create Gig - TrustFlow</title>
        <meta name="description" content="Create a new gig with milestone-based escrow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />

        <main className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Create a New Gig
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up milestone-based escrow for secure, trustless payments
            </p>
          </div>

          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                        ${
                          idx < currentStep
                            ? 'bg-green-500 text-white'
                            : idx === currentStep
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                        }
                      `}
                    >
                      {idx < currentStep ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        idx <= currentStep
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded ${
                        idx < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form content */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8">
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gig Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Smart Contract Audit for DeFi Protocol"
                    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white ${
                      errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    }`}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide detailed requirements, deliverables, and expectations..."
                    rows={6}
                    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white ${
                      errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    }`}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Budget (XLM) *
                    </label>
                    <input
                      type="number"
                      value={formData.totalBudget}
                      onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                      placeholder="5000"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white ${
                        errors.totalBudget ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                      }`}
                    />
                    {errors.totalBudget && <p className="text-red-500 text-sm mt-1">{errors.totalBudget}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Freelancer&apos;s Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiaryAddress}
                    onChange={(e) => setFormData({ ...formData, beneficiaryAddress: e.target.value })}
                    placeholder="G..."
                    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white font-mono text-sm ${
                      errors.beneficiaryAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    }`}
                  />
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                    The escrow contract locks funds for a specific freelancer up front. Enter the Stellar
                    address of the freelancer you&apos;re hiring for this gig.
                  </p>
                  {errors.beneficiaryAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.beneficiaryAddress}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Milestones */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Define Milestones
                  </h3>
                  <button
                    onClick={addMilestone}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    + Add Milestone
                  </button>
                </div>

                {formData.milestones.map((milestone, idx) => (
                  <div
                    key={milestone.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Milestone {idx + 1}
                      </h4>
                      {formData.milestones.length > 1 && (
                        <button
                          onClick={() => removeMilestone(milestone.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white text-sm ${
                          errors[`milestone-${idx}-title`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                        }`}
                      />
                      {errors[`milestone-${idx}-title`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`milestone-${idx}-title`]}</p>
                      )}
                    </div>

                    <div>
                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        placeholder="Describe deliverables for this milestone..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                          placeholder="Amount (XLM)"
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white text-sm ${
                            errors[`milestone-${idx}-amount`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                          }`}
                        />
                        {errors[`milestone-${idx}-amount`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`milestone-${idx}-amount`]}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={milestone.duration}
                          onChange={(e) => updateMilestone(milestone.id, 'duration', e.target.value)}
                          placeholder="Duration (e.g., 2 weeks)"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Gig Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Title:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formData.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Budget:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formData.totalBudget} XLM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Milestones:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formData.milestones.length}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600 dark:text-gray-400 shrink-0">Freelancer:</span>
                      <span className="font-medium text-gray-900 dark:text-white font-mono text-xs break-all text-right">
                        {formData.beneficiaryAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                    {formData.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Milestone Breakdown</h3>
                  <div className="space-y-3">
                    {formData.milestones.map((m, idx) => (
                      <div key={m.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {idx + 1}. {m.title}
                          </span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {m.amount} XLM
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
                        )}
                        {m.duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Duration: {m.duration}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Once created, funds will be locked in escrow until milestones are completed and approved. Make sure all details are correct before submitting.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Escrow…' : 'Create Gig'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default CreateGig
