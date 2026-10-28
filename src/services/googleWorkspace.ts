import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse app instance if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with the approved scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory only (never in localStorage per security guidelines)
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE CALENDAR API METHODS
// ==========================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const listCalendarEvents = async (token?: string): Promise<CalendarEvent[]> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&maxResults=10&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao carregar eventos da agenda (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []) as CalendarEvent[];
};

export const createCalendarEvent = async (
  eventData: {
    summary: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    attendeeEmail?: string;
  },
  token?: string
): Promise<CalendarEvent> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const body: any = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.startDateTime,
    },
    end: {
      dateTime: eventData.endDateTime,
    },
  };

  if (eventData.attendeeEmail) {
    body.attendees = [{ email: eventData.attendeeEmail }];
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao criar evento na agenda (${res.status})`);
  }

  return await res.json();
};

export const deleteCalendarEvent = async (eventId: string, token?: string): Promise<void> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao excluir evento (${res.status})`);
  }
};

// ==========================================
// GOOGLE SHEETS API METHODS
// ==========================================

export interface LeadRow {
  date: string;
  name: string;
  phone: string;
  service: string;
  status: string;
  notes: string;
}

export const createLeadsSpreadsheet = async (
  title = 'Leads & Atendimentos LIA - Start Mkt Local',
  token?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Leads',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Data / Hora' } },
                  { userEnteredValue: { stringValue: 'Nome do Cliente' } },
                  { userEnteredValue: { stringValue: 'WhatsApp / Telefone' } },
                  { userEnteredValue: { stringValue: 'Serviço de Interesse' } },
                  { userEnteredValue: { stringValue: 'Status do Lead' } },
                  { userEnteredValue: { stringValue: 'Observações / Origem' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao criar planilha (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
};

export const appendLeadToSheet = async (
  spreadsheetId: string,
  lead: LeadRow,
  token?: string
): Promise<void> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A:F:append?valueInputOption=USER_ENTERED`;

  const values = [
    [lead.date, lead.name, lead.phone, lead.service, lead.status, lead.notes],
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao salvar lead na planilha (${res.status})`);
  }
};

export const fetchSheetLeads = async (
  spreadsheetId: string,
  token?: string
): Promise<string[][]> => {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Não autenticado com o Google');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1:F50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao ler planilha (${res.status})`);
  }

  const data = await res.json();
  return (data.values || []) as string[][];
};
