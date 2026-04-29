'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, login, register } from '@/shared/lib/auth-api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      router.replace('/');
    }
  }, [router]);

  const pageTitle = useMemo(() => (isRegisterMode ? '创建账户' : '欢迎回来'), [isRegisterMode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = username.trim().toLowerCase();
    if (!normalized) {
      setError('请输入用户名。');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 位。');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setError('两次密码输入不一致。');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isRegisterMode) {
        await register({ username: normalized, password });
      } else {
        await login({ username: normalized, password });
      }
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <section className="grid w-full gap-6 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur md:grid-cols-2 md:p-10">
          <div className="space-y-5 border-b border-white/10 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <p className="inline-block rounded-full border border-cyan-300/40 px-3 py-1 text-xs tracking-[0.2em] text-cyan-300">
              MEMO LIST
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">
              {pageTitle}
            </h1>
            <p className="text-sm text-slate-300">
              登录后可按账号隔离任务数据，学习记录和复习排期会自动保存到你的用户空间。
            </p>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              提示: 首次使用请先注册账号，后续直接登录即可。
            </div>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">用户名</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                placeholder="例如: student01"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">密码</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                placeholder="至少 6 位"
              />
            </label>

            {isRegisterMode ? (
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">确认密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                />
              </label>
            ) : null}

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? '提交中...' : isRegisterMode ? '注册并登录' : '登录'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsRegisterMode((prev) => !prev);
              }}
              className="w-full rounded-lg border border-white/20 py-2.5 text-sm text-slate-200 transition hover:bg-white/5"
            >
              {isRegisterMode ? '已有账号，去登录' : '没有账号，去注册'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
