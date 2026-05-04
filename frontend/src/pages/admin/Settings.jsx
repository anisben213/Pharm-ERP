import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import InputField from '../../components/forms/InputField.jsx';
import SelectField from '../../components/forms/SelectField.jsx';
import { useToast } from '../../hooks/useToast.js';

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState({
    companyName: 'PharmaLab',
    currency: 'EUR',
    timezone: 'Europe/Casablanca',
    language: 'en',
    sessionTimeout: '30',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Settings saved');
    }, 500);
  };

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Global configuration & preferences." />
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold mb-4">Company</h3>
          <InputField label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <SelectField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={[
              {value:'DZD',label:'DZD — Algerian Dinar (دج)'},
              {value:'EUR',label:'EUR — Euro (€)'}
            ]} />
          <SelectField label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            options={['Europe/Casablanca','Europe/Paris','UTC']} />
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Preferences</h3>
          <SelectField label="Default Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
            options={[{value:'en',label:'English'},{value:'fr',label:'Français'}]} />
          <InputField label="Session Timeout (min)" type="number" value={form.sessionTimeout} onChange={(e) => setForm({ ...form, sessionTimeout: e.target.value })} />
        </div>

        <div className="lg:col-span-2 flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
