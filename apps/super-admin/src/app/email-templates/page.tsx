'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { apiRequest } from '@/lib/api';
import {
  Mail,
  Plus,
  Eye,
  Send,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Code,
  Search,
  Check,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'SYSTEM',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    variables: [] as string[],
    isActive: true,
  });
  const [variablesInput, setVariablesInput] = useState('');
  const [editorTab, setEditorTab] = useState<'editor' | 'preview'>('editor');
  const [renderedPreview, setRenderedPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Send Test Email modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await apiRequest<EmailTemplate[]>('/super-admin/email-templates');
      if (res.success) {
        setTemplates(res.data || []);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to fetch email templates' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to fetch email templates' });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      slug: '',
      category: 'ONBOARDING',
      subject: '',
      bodyHtml: '<div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">\n  <h2 style="color: #4F46E5;">Hello {{user_name}},</h2>\n  <p>Welcome to <strong>{{app_name}}</strong>!</p>\n</div>',
      bodyText: '',
      variables: ['app_name', 'user_name'],
      isActive: true,
    });
    setVariablesInput('app_name, user_name');
    setEditorTab('editor');
    setIsModalOpen(true);
  }

  function openEditModal(template: EmailTemplate) {
    setIsEditing(true);
    setCurrentId(template.id);
    setFormData({
      name: template.name,
      slug: template.slug,
      category: template.category,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText || '',
      variables: template.variables || [],
      isActive: template.isActive,
    });
    setVariablesInput((template.variables || []).join(', '));
    setEditorTab('editor');
    setIsModalOpen(true);
  }

  function handlePreviewTab() {
    setEditorTab('preview');
    const sample: Record<string, string> = {
      app_name: 'Webin10',
      business_name: 'Apex Fitness Studio',
      user_name: 'Rahul Sharma',
      login_url: 'https://app.webin10.com/login',
      plan_name: 'Growth Plan',
      expiry_date: '31 Dec 2026',
      days_remaining: '5',
      renew_url: 'https://app.webin10.com/billing/renew',
      invoice_number: 'INV-2026-0042',
      amount_paid: '₹999.00',
      payment_date: '24 Nov 2026',
      download_url: 'https://app.webin10.com/invoices/INV-0042.pdf',
      reset_link: 'https://app.webin10.com/reset-password?token=sample_token',
      expiry_minutes: '30',
      support_email: 'support@webin10.com',
    };

    let rendered = formData.bodyHtml;
    for (const [key, value] of Object.entries(sample)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    setRenderedPreview(rendered);
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const parsedVars = variablesInput
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    try {
      let res;
      if (isEditing && currentId) {
        res = await apiRequest(`/super-admin/email-templates/${currentId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            subject: formData.subject,
            bodyHtml: formData.bodyHtml,
            bodyText: formData.bodyText,
            variables: parsedVars,
            isActive: formData.isActive,
          }),
        });
      } else {
        res = await apiRequest('/super-admin/email-templates', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            variables: parsedVars,
          }),
        });
      }

      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `Template '${formData.name}' ${isEditing ? 'updated' : 'created'} successfully`,
        });
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to save template' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(template: EmailTemplate) {
    if (!confirm(`Are you sure you want to delete template '${template.name}'?`)) return;
    try {
      const res = await apiRequest(`/super-admin/email-templates/${template.id}`, { method: 'DELETE' });
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Template '${template.name}' deleted` });
        fetchTemplates();
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to delete template' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete template' });
    }
  }

  function openTestModal(template: EmailTemplate) {
    setTestTemplate(template);
    setTestRecipient('');
    setTestResult(null);
    setTestModalOpen(true);
  }

  async function handleSendTest() {
    if (!testTemplate || !testRecipient) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await apiRequest<any>(`/super-admin/email-templates/${testTemplate.id}/send-test`, {
        method: 'POST',
        body: JSON.stringify({ recipientEmail: testRecipient }),
      });
      if (res.success) {
        setTestResult(res.data);
      } else {
        setTestResult({ success: false, message: res.error || 'Failed to send test email' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  }

  const categories = ['ALL', 'ONBOARDING', 'SUBSCRIPTION', 'AUTH', 'BILLING', 'SYSTEM'];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.slug.toLowerCase().includes(search.toLowerCase()) ||
      tpl.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || tpl.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactional Email Templates</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage HTML email notifications, dynamic variables, and dispatch live test copies via Google / Custom SMTP
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Email Template</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name, slug or subject line..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Table Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No email templates match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3.5 px-6">Template Name</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Subject Line</th>
                    <th className="py-3.5 px-6">Variables</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{tpl.name}</div>
                        <div className="font-mono text-xs text-indigo-600">{tpl.slug}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {tpl.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 max-w-xs truncate">
                        {tpl.subject}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(tpl.variables || []).slice(0, 3).map((v) => (
                            <span
                              key={v}
                              className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-600 font-mono border border-slate-200"
                            >
                              &#123;&#123;{v}&#125;&#125;
                            </span>
                          ))}
                          {(tpl.variables || []).length > 3 && (
                            <span className="text-[11px] text-slate-400">
                              +{tpl.variables.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {tpl.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTestModal(tpl)}
                            title="Send Live Test Email via SMTP"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors border border-indigo-100"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(tpl)}
                            title="Edit Template & Visual Preview"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl)}
                            title="Delete Template"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit / Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    {isEditing ? `Edit Template: ${formData.name}` : 'Create New Email Template'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Template Name:*
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Welcome & Activation"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slug Identifier:*
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isEditing}
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="welcome_email"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category:
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ONBOARDING">ONBOARDING</option>
                      <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                      <option value="AUTH">AUTH</option>
                      <option value="BILLING">BILLING</option>
                      <option value="SYSTEM">SYSTEM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Line:* <span className="text-slate-400 font-normal">(Variables: &#123;&#123;app_name&#125;&#125;, etc.)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Welcome to {{app_name}}!"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dynamic Variables: <span className="text-slate-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={variablesInput}
                    onChange={(e) => setVariablesInput(e.target.value)}
                    placeholder="app_name, user_name, login_url, expiry_date"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Editor Tabs: HTML Source vs Live Preview */}
                <div className="pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditorTab('editor')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          editorTab === 'editor'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" /> HTML Source Editor
                      </button>
                      <button
                        type="button"
                        onClick={handlePreviewTab}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          editorTab === 'preview'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Visual Live Preview
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">Renders HTML preview with sample data</span>
                  </div>

                  {editorTab === 'editor' ? (
                    <div className="mt-2">
                      <textarea
                        rows={12}
                        required
                        value={formData.bodyHtml}
                        onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                        placeholder="<div style='...'>...</div>"
                        className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 p-6 bg-slate-50 rounded-lg min-h-[300px] border border-slate-200 text-slate-900 overflow-auto">
                      <div dangerouslySetInnerHTML={{ __html: renderedPreview }} />
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Test Modal */}
        {testModalOpen && testTemplate && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Send Live Test Email</h3>
                </div>
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs text-slate-400">Template:</div>
                  <div className="font-semibold text-slate-900">{testTemplate.name}</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono truncate">
                    Subject: {testTemplate.subject}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Email Address:*
                  </label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <p className="font-semibold">{testResult.message || (testResult.success ? 'Email dispatched successfully!' : 'Delivery failed')}</p>
                    {testResult.messageId && (
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        Message ID: {testResult.messageId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest || !testRecipient}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
