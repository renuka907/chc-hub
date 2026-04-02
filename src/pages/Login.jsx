import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Login() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (isSignUp) {
        // Validate access code
        const { data: codeRows } = await supabase.from('app_settings').select('value').eq('key', 'access_code').single();
        const validCode = codeRows?.value || 'CHC2026';
        if (accessCode.trim().toUpperCase() !== validCode.toUpperCase()) {
          throw new Error('Invalid access code. Please contact your administrator.');
        }
        await signup(email, password, { full_name: fullName });
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setIsSignUp(false);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || (isSignUp ? "Signup failed" : "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Raining logos animation
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Load CHC logo
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png';

    // Also draw stethoscope emoji as fallback
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * -1500 - 50,
      speed: 0.5 + Math.random() * 1.5,
      size: 24 + Math.random() * 28,
      opacity: 0.08 + Math.random() * 0.15,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.015,
      rotation: Math.random() * 0.3 - 0.15,
      rotSpeed: (Math.random() - 0.5) * 0.003,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.speed;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotSpeed;
        const wx = p.x + Math.sin(p.wobble) * 30;

        if (p.y > canvas.height + 60) {
          p.y = -60 - Math.random() * 200;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(wx, p.y);
        ctx.rotate(p.rotation);

        if (logo.complete && logo.naturalWidth > 0) {
          const aspect = logo.naturalWidth / logo.naturalHeight;
          const w = p.size * aspect;
          ctx.drawImage(logo, -w / 2, -p.size / 2, w, p.size);
        } else {
          // Fallback: draw a simple stethoscope icon
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🩺', 0, 0);
        }
        ctx.restore();
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6B9FCC] via-[#7BAFD4] to-[#E8A0B5] p-4 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      <Card className="w-full max-w-md shadow-2xl border-0 relative" style={{ zIndex: 1 }}>
        <CardHeader className="text-center space-y-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png"
            alt="CHC Logo"
            className="h-16 mx-auto mb-2"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <CardTitle className="text-2xl bg-gradient-to-r from-[#6B9FCC] to-[#E8A0B5] bg-clip-text text-transparent">CHC Hub</CardTitle>
          <CardDescription>{isSignUp ? "Create your account" : "Sign in to your account"}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}
          {isSignUp ? (
            <form key="signup-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Hidden decoy fields to absorb Chrome autofill */}
              <input type="text" name="fake-name" autoComplete="username" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />
              <input type="password" name="fake-pass" autoComplete="current-password" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex={-1} />
              <div className="space-y-2">
                <Label htmlFor="signup-fullname">Full Name</Label>
                <Input 
                  id="signup-fullname"
                  name="signup-fullname"
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-accesscode">Access Code</Label>
                <Input 
                  id="signup-accesscode"
                  name="signup-accesscode"
                  type="text" 
                  value={accessCode} 
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  required
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">Ask your administrator for the access code</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email"
                  name="signup-email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password"
                  name="signup-password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#6B9FCC] to-[#E8A0B5] hover:from-[#5889B5] hover:to-[#D48BA3]" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <span>Already have an account?{" "}
                  <button type="button" onClick={() => { setIsSignUp(false); setEmail(""); setPassword(""); setError(""); setSuccess(""); }} className="text-[#6B9FCC] hover:text-[#3A6B8C] font-medium underline">
                    Sign in
                  </button>
                </span>
              </div>
            </form>
          ) : (
            <form key="login-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  name="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#6B9FCC] to-[#E8A0B5] hover:from-[#5889B5] hover:to-[#D48BA3]" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) { setError("Enter your email first, then click Forgot Password."); return; }
                    setError(""); setSuccess("");
                    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: "https://chchub.com/reset-password",
                    });
                    if (resetErr) setError(resetErr.message);
                    else setSuccess("Password reset email sent! Check your inbox.");
                  }}
                  className="text-sm text-[#6B9FCC] hover:text-[#3A6B8C] underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <span>Need an account?{" "}
                  <button type="button" onClick={() => { setIsSignUp(true); setEmail(""); setPassword(""); setFullName(""); setAccessCode(""); setError(""); setSuccess(""); }} className="text-[#6B9FCC] hover:text-[#3A6B8C] font-medium underline">
                    Create one
                  </button>
                </span>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
