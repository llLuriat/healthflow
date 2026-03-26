import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

interface Step1 {
  clinicName: string;
  segment: string;
}
interface Step2 {
  email: string;
  password: string;
  confirmPassword: string;
}

const SEGMENTS = [
  { value: "medico", label: "Clínica Médica" },
  { value: "dental", label: "Odontologia" },
  { value: "veterinaria", label: "Veterinária" },
  { value: "oftalmologia", label: "Oftalmologia" },
];

export default function PrimeiroAcessoPage() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [copied, setCopied] = useState(false);

  const f1 = useForm<Step1>();
  const f2 = useForm<Step2>();
  const pwd = f2.watch("password");

  const nextStep = f1.handleSubmit(() => setStep(2));

  const onSubmit = f2.handleSubmit(async (d2) => {
    const d1 = f1.getValues();
    setLoading(true);
    try {
      const result = await registerAccount(
        d1.clinicName,
        d2.email,
        d2.password,
      );
      setTenantId(result.tenantId);
      setStep(3);
      toast.success("Conta criada! Guarde seu Tenant ID.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409)
        toast.error("E-mail já cadastrado.");
      else toast.error((err as Error).message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  });

  const copy = () => {
    navigator.clipboard.writeText(tenantId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: "var(--hf-primary)" }}
          >
            <Activity className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-gray-900">HealthFlow</span>
        </Link>

        <Card className="border-gray-200 shadow-xl">
          <CardContent className="p-8">
            {/* ── Step 3: Sucesso ── */}
            {step === 3 && (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Conta criada!
                  </h1>
                  <p className="text-sm text-gray-600">
                    Guarde seu <strong>Tenant ID</strong> — você precisará dele
                    para entrar.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Tenant ID
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-800 break-all flex-1">
                      {tenantId}
                    </code>
                    <button
                      onClick={copy}
                      className="p-2 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full text-white"

                  onClick={() => navigate("/login")}
                >
                  Ir para o Login <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* ── Steps 1 e 2 ── */}
            {step !== 3 && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Comece seu teste grátis
                  </h1>
                  <p className="text-gray-600 text-sm">
                    14 dias grátis. Sem cartão de crédito.
                  </p>
                </div>

                {/* Barra de progresso */}
                <div className="flex gap-2 mb-7">
                  {[1, 2].map((n) => (
                    <div
                      key={n}
                      className="flex-1 h-2 rounded-full transition-colors"
                      style={{
                        backgroundColor:
                          step >= n ? "var(--hf-primary)" : "#E5E7EB",
                      }}
                    />
                  ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                  <form onSubmit={nextStep} className="space-y-5">
                    <div className="space-y-1">
                      <Label>Nome da Clínica *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Ex: Clínica Saúde+"
                          className={`pl-9 ${f1.formState.errors.clinicName ? "border-red-500" : ""}`}
                          maxLength={100}
                          {...f1.register("clinicName", {
                            required: "Nome é obrigatório",
                            minLength: {
                              value: 3,
                              message: "Mínimo 3 caracteres",
                            },
                          })}
                        />
                      </div>
                      {f1.formState.errors.clinicName && (
                        <p className="text-xs text-red-600">
                          {f1.formState.errors.clinicName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>Segmento *</Label>
                      <Select
                        value={f1.watch("segment")}
                        onValueChange={(v) =>
                          f1.setValue("segment", v, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger
                          className={
                            f1.formState.errors.segment ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Selecione seu segmento" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENTS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="hidden"
                        {...f1.register("segment", {
                          required: "Segmento é obrigatório",
                        })}
                      />
                      {f1.formState.errors.segment && (
                        <p className="text-xs text-red-600">
                          {f1.formState.errors.segment.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-white"

                    >
                      Continuar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <Label>E-mail *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="seu@clinica.com"
                          className={`pl-9 ${f2.formState.errors.email ? "border-red-500" : ""}`}
                          disabled={loading}
                          {...f2.register("email", {
                            required: "E-mail é obrigatório",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "E-mail inválido",
                            },
                          })}
                        />
                      </div>
                      {f2.formState.errors.email && (
                        <p className="text-xs text-red-600">
                          {f2.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPwd ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          className={`pl-9 pr-9 ${f2.formState.errors.password ? "border-red-500" : ""}`}
                          disabled={loading}
                          {...f2.register("password", {
                            required: "Senha é obrigatória",
                            minLength: {
                              value: 8,
                              message: "Mínimo 8 caracteres",
                            },
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          {showPwd ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {f2.formState.errors.password && (
                        <p className="text-xs text-red-600">
                          {f2.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>Confirmar Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showCfm ? "text" : "password"}
                          placeholder="Repita a senha"
                          className={`pl-9 pr-9 ${f2.formState.errors.confirmPassword ? "border-red-500" : ""}`}
                          disabled={loading}
                          {...f2.register("confirmPassword", {
                            required: "Confirmação obrigatória",
                            validate: (v) =>
                              v === pwd || "As senhas não coincidem",
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCfm(!showCfm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          {showCfm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {f2.formState.errors.confirmPassword && (
                        <p className="text-xs text-red-600">
                          {f2.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 text-white"

                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            Criar Conta <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="mt-6 pt-5 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Já tem conta?{" "}
                    <Link
                      to="/login"
                      className="font-medium hover:underline"
                      style={{ color: "var(--hf-primary)" }}
                    >
                      Fazer login
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
