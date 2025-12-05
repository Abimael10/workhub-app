import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { registerUser, type RegistrationInput } from "@/server/auth/registration";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("[auth] register failed to parse JSON", error);
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  try {
    const { user, membership, organization } = await registerUser(payload as RegistrationInput);
    return NextResponse.json(
      {
        success: true,
        userId: user!.id,
        membershipId: membership!.id,
        organizationId: organization!.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Datos inválidos", issues: error.flatten() }, { status: 400 });
    }

    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      return NextResponse.json({ message: "Este correo ya está registrado" }, { status: 409 });
    }

    console.error("[auth] register failed", error);
    return NextResponse.json({ message: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
