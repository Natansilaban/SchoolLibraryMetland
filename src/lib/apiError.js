const isProd = process.env.NODE_ENV === 'production';

export function serverErrMsg(error) {
  if (!isProd) console.error('[API Error]', error);
  return isProd ? 'Internal server error' : (error?.message ?? 'Unknown error');
}
