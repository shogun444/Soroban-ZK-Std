"use client";

import React from "react";
import { DocsLayout } from "@/components/DocsLayout";
import { CodeBlock } from "@/components/CodeBlock";

export default function EllipticCurvesPage() {
  return (
    <DocsLayout>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 uppercase tracking-wider">
            Core Concepts
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight mb-4">
          Elliptic Curve Point Validation
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl">
          Security checks and subgroup validation methods for G1 and G2 points
          on the BN254 curve. Every point used in a proof or pairing must pass
          these checks before being trusted.
        </p>
      </div>

      <hr className="border-neutral-200 dark:border-neutral-800 mb-10" />

      {/* Why validation matters */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          Why Point Validation Matters
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          Accepting an unvalidated elliptic curve point in a ZK verifier opens
          two classes of attack:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
              Invalid Curve Attack
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              A point with coordinates that satisfy neither the BN254 curve
              equation nor any related curve. Operations on it produce
              cryptographically meaningless results that may still pass a
              naive equality check.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
              Small Subgroup Attack
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              A point on the correct curve but in a small-order subgroup. A
              prover can exploit the low order to forge a proof that the
              verifier accepts, even without knowing the witness.
            </p>
          </div>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          This library provides two levels of G1 validation —{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            is_valid_g1
          </code>{" "}
          (curve membership) and{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            is_valid_g1_subgroup
          </code>{" "}
          (full security) — and coordinate-bound checks for G2. Use the
          strongest check your gas budget allows; always use subgroup
          validation on user-supplied points.
        </p>
      </section>

      {/* G1 validation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          G1 Point Validation
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
          G1 is the primary group used for proof elements in Groth16, PLONK,
          and most ZK constructions on BN254. Points are expressed in affine
          coordinates{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            (x, y)
          </code>{" "}
          over the base field Fq.
        </p>

        {/* Two levels side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="font-bold text-black dark:text-white mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Level 1 — On-curve check
            </h3>
            <code className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-2">
              Bn254::is_valid_g1(x, y) -&gt; bool
            </code>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Checks that the coordinates are in Fq and satisfy the curve
              equation{" "}
              <span className="font-mono">y² = x³ + 3 (mod p)</span>.
              Does <strong>not</strong> check subgroup membership.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="font-bold text-black dark:text-white mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Level 2 — Subgroup check
            </h3>
            <code className="block text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-2">
              Bn254::is_valid_g1_subgroup(x, y) -&gt; bool
            </code>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Runs the on-curve check first, then multiplies the point by
              the group order{" "}
              <span className="font-mono">r</span> and verifies the result
              is the point at infinity. Prevents small-subgroup attacks.
            </p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-black dark:text-white mb-3">
          On-curve check
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          Rejects the point at infinity{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            (0, 0)
          </code>
          , then confirms both coordinates are less than the Fq modulus{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            p
          </code>
          , and finally verifies the Weierstrass equation:
        </p>
        <CodeBlock
          code={`use zk_core::Bn254;

// The BN254 G1 curve: y² = x³ + 3 over Fq
// p = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47

// Generator point — always valid
let (gx, gy) = (ethnum::u256::from(1u8), ethnum::u256::from(2u8));
assert!(Bn254::is_valid_g1(gx, gy));

// Point at infinity is explicitly rejected
assert!(!Bn254::is_valid_g1(0u8.into(), 0u8.into()));

// Coordinate out of Fq range is rejected
assert!(!Bn254::is_valid_g1(Bn254::FQ_MODULUS, 0u8.into()));

// Arbitrary (x, y) that doesn't satisfy y² = x³ + 3 is rejected
assert!(!Bn254::is_valid_g1(1u8.into(), 3u8.into()));`}
          language="rust"
          filename="g1_on_curve.rs"
        />

        <h3 className="text-lg font-bold text-black dark:text-white mb-3 mt-8">
          Subgroup check
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          Runs the on-curve check first, then computes{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            r · P
          </code>{" "}
          using the scalar multiplication primitive. A point in the correct
          prime-order subgroup must map to the point at infinity; anything
          else is rejected.
        </p>
        <CodeBlock
          code={`use zk_core::Bn254;

// Use this for any G1 point supplied by an external party (user input,
// proof element, on-chain calldata). On-curve alone is not enough.

let x = ethnum::u256::from(1u8);
let y = ethnum::u256::from(2u8);

if !Bn254::is_valid_g1_subgroup(x, y) {
    // Reject — point is either off-curve or in the wrong subgroup
    return Err(ZkError::InvalidInput);
}

// Safe to use in scalar multiplication or as a pairing argument`}
          language="rust"
          filename="g1_subgroup.rs"
        />

        <div className="mt-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Gas cost note
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            The subgroup check performs a full 254-bit scalar multiplication
            in guest Wasm. For trusted constants (e.g. the generator point
            hardcoded in your contract),{" "}
            <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs font-mono">
              is_valid_g1
            </code>{" "}
            is sufficient and considerably cheaper. Reserve{" "}
            <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs font-mono">
              is_valid_g1_subgroup
            </code>{" "}
            for externally-supplied points.
          </p>
        </div>
      </section>

      {/* G2 validation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          G2 Point Validation
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          G2 lives in the degree-2 extension field Fq². Each coordinate is a
          pair{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            (c0, c1)
          </code>{" "}
          representing{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            c0 + c1·u
          </code>
          . A G2 point therefore has four{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            u256
          </code>{" "}
          components, all of which must be canonical Fq elements.
        </p>

        <h3 className="text-lg font-bold text-black dark:text-white mb-3">
          G2Affine layout
        </h3>
        <CodeBlock
          code={`use zk_soroban::pairing::G2Affine;

/// G2 point in affine coordinates over Fq².
/// x = x.0 + x.1·u  (c0 real, c1 imaginary)
/// y = y.0 + y.1·u  (c0 real, c1 imaginary)
pub struct G2Affine {
    pub x: (u256, u256),  // (c0, c1)
    pub y: (u256, u256),  // (c0, c1)
}

// BN254 G2 generator
let g2 = G2Affine {
    x: (
        u256::from_str_radix(
            "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed", 16,
        ).unwrap(),
        u256::from_str_radix(
            "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2", 16,
        ).unwrap(),
    ),
    y: (
        u256::from_str_radix(
            "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa", 16,
        ).unwrap(),
        u256::from_str_radix(
            "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b", 16,
        ).unwrap(),
    ),
};`}
          language="rust"
          filename="g2_struct.rs"
        />

        <h3 className="text-lg font-bold text-black dark:text-white mb-3 mt-8">
          Coordinate bounds check
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
          All four components must be less than the Fq modulus{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            p
          </code>
          . This is enforced via{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            Bn254::is_valid_fq
          </code>{" "}
          on each component before the point is passed to the native host
          pairing call.
        </p>
        <CodeBlock
          code={`use zk_core::Bn254;

// Validate all four Fq² components before use.
// p = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47

fn validate_g2(g2: &G2Affine) -> bool {
    let (x0, x1) = g2.x;
    let (y0, y1) = g2.y;
    Bn254::is_valid_fq(x0)
        && Bn254::is_valid_fq(x1)
        && Bn254::is_valid_fq(y0)
        && Bn254::is_valid_fq(y1)
}

// A component equal to p (not strictly less) is rejected
let mut bad_g2 = g2_generator();
bad_g2.x.0 = Bn254::FQ_MODULUS; // x.c0 == p — out of range
assert!(!validate_g2(&bad_g2));`}
          language="rust"
          filename="g2_validate.rs"
        />

        <div className="mt-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <p className="text-sm font-semibold text-black dark:text-white mb-1">
            Why no full G2 subgroup check?
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            A complete G2 subgroup check requires arithmetic in Fq² which is
            not available as a native host function. The coordinate-bounds
            check blocks the most common malformed-input attacks at low cost.
            If your protocol requires a full G2 subgroup check, perform it
            off-chain and commit the result on-chain.
          </p>
        </div>
      </section>

      {/* Field element helpers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          Field Element Helpers
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          Two standalone predicates cover the underlying field checks that
          the curve validators build on:
        </p>
        <CodeBlock
          code={`use zk_core::Bn254;

// Fq (base field) — used for G1 x/y and G2 component bounds
// p = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47
assert!(Bn254::is_valid_fq(ethnum::u256::from(0u8)));       // 0 is valid
assert!(Bn254::is_valid_fq(Bn254::FQ_MODULUS - 1u8.into())); // p-1 is valid
assert!(!Bn254::is_valid_fq(Bn254::FQ_MODULUS));             // p itself is not

// Fr (scalar field) — used for scalars and Poseidon2 inputs
// r = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
assert!(Bn254::is_valid_scalar(ethnum::u256::from(0u8)));
assert!(!Bn254::is_valid_scalar(Bn254::FR_MODULUS));`}
          language="rust"
          filename="field_checks.rs"
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left py-3 pr-6 font-bold text-black dark:text-white">Function</th>
                <th className="text-left py-3 pr-6 font-bold text-black dark:text-white">Checks</th>
                <th className="text-left py-3 font-bold text-black dark:text-white">Use for</th>
              </tr>
            </thead>
            <tbody className="text-neutral-600 dark:text-neutral-400">
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                <td className="py-3 pr-6 font-mono text-xs">is_valid_fq(v)</td>
                <td className="py-3 pr-6">v &lt; p (base field)</td>
                <td className="py-3">G1 x/y coords, G2 components</td>
              </tr>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                <td className="py-3 pr-6 font-mono text-xs">is_valid_scalar(v)</td>
                <td className="py-3 pr-6">v &lt; r (scalar field)</td>
                <td className="py-3">Scalars, Poseidon2 inputs, Fr elements</td>
              </tr>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                <td className="py-3 pr-6 font-mono text-xs">is_valid_g1(x, y)</td>
                <td className="py-3 pr-6">Fq bounds + curve equation</td>
                <td className="py-3">Trusted constants, intermediate results</td>
              </tr>
              <tr>
                <td className="py-3 pr-6 font-mono text-xs">is_valid_g1_subgroup(x, y)</td>
                <td className="py-3 pr-6">On-curve + r·P = O</td>
                <td className="py-3">User-supplied proof elements</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* pairing_check integrates everything */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          Validation Inside{" "}
          <code className="text-2xl font-mono">pairing_check</code>
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          If you use{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            pairing_check
          </code>{" "}
          from{" "}
          <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
            zk_soroban::pairing
          </code>
          , the full validation pipeline runs automatically for every pair
          before the native host call is made. You do not need to call the
          individual validators separately.
        </p>
        <CodeBlock
          code={`use zk_soroban::pairing::{pairing_check, G2Affine};
use zk_core::{G1Affine, ZkError};

// pairing_check runs, for every (G1, G2) pair:
//   1. Bn254::is_valid_g1_subgroup(g1.x, g1.y) — full G1 security check
//   2. validate_g2_coords(g2)                  — all four Fq² bounds
// If either check fails → Err(ZkError::InvalidInput), no host call is made.

let result = pairing_check(&env, &[(proof_a, vk_b)]);

match result {
    Ok(true)  => { /* proof accepted */ }
    Ok(false) => { /* proof rejected — pairing product ≠ 1 */ }
    Err(ZkError::InvalidInput) => { /* malformed point — reject immediately */ }
    Err(_) => unreachable!(),
}`}
          language="rust"
          filename="pairing_validation.rs"
        />
      </section>

      {/* Complete contract example */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          Example: Validating Before Storage
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          When a contract stores a G1 point from user input — for example a
          public key or commitment — validate it at submission time so every
          subsequent read is guaranteed safe.
        </p>
        <CodeBlock
          code={`use soroban_sdk::{contract, contractimpl, Env, U256};
use zk_core::{Bn254, G1Affine, ZkError};

#[contract]
pub struct CommitmentStore;

#[contractimpl]
impl CommitmentStore {
    /// Store a G1 commitment submitted by a user.
    /// Rejects the transaction if the point is invalid or in the wrong subgroup.
    pub fn store_commitment(env: Env, x: U256, y: U256) -> Result<(), u32> {
        let x = x.to_u256();
        let y = y.to_u256();

        // Full security check: on-curve + prime-order subgroup membership.
        // Use is_valid_g1 instead if x/y come from a trusted source.
        if !Bn254::is_valid_g1_subgroup(x, y) {
            return Err(1); // invalid point
        }

        let point = G1Affine { x, y };
        env.storage().persistent().set(&"commitment", &point);
        Ok(())
    }

    /// Read the stored commitment — guaranteed valid because we checked on write.
    pub fn get_commitment(env: Env) -> (U256, U256) {
        let point: G1Affine = env.storage().persistent().get(&"commitment").unwrap();
        (U256::from_u256(&env, point.x), U256::from_u256(&env, point.y))
    }
}`}
          language="rust"
          filename="commitment_store.rs"
        />
      </section>

      {/* Security summary */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          Security Checklist
        </h2>
        <div className="space-y-3">
          {([
            "All user-supplied G1 points are validated with is_valid_g1_subgroup before use.",
            "All four Fq² components of any G2 point are checked with is_valid_fq before passing to a pairing.",
            "Scalars are validated with is_valid_scalar (< r) before being used as Poseidon2 inputs or scalar multipliers.",
            "pairing_check is used instead of calling the host pairing directly — it runs the full pipeline automatically.",
            "Trusted constants (hardcoded generator points) use is_valid_g1 to avoid the cost of the full subgroup scalar multiplication.",
          ] as string[]).map((text, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
            >
              <span className="mt-0.5 flex-none w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* API summary */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight mb-4">
          API Summary
        </h2>
        <div className="space-y-4">
          {[
            {
              sig: "Bn254::is_valid_g1(x: u256, y: u256) -> bool",
              desc: "Returns true if (x, y) is in Fq and satisfies y² = x³ + 3 mod p. Rejects the point at infinity.",
            },
            {
              sig: "Bn254::is_valid_g1_subgroup(x: u256, y: u256) -> bool",
              desc: "Runs is_valid_g1, then checks r·P = O. Prevents small-subgroup attacks. Required for user-supplied points.",
            },
            {
              sig: "Bn254::is_valid_fq(val: u256) -> bool",
              desc: "Returns true if val < p (BN254 base field modulus). Use for G1 coordinates and G2 Fq² components.",
            },
            {
              sig: "Bn254::is_valid_scalar(val: u256) -> bool",
              desc: "Returns true if val < r (BN254 scalar field modulus). Use for scalars and Poseidon2 inputs.",
            },
            {
              sig: "pairing_check(env, pairs: &[(G1Affine, G2Affine)]) -> Result<bool, ZkError>",
              desc: "Validates all G1 (subgroup) and G2 (Fq² bounds) points, then calls the native host pairing. Returns Err(InvalidInput) if any point is malformed.",
            },
          ].map(({ sig, desc }) => (
            <div
              key={sig}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
            >
              <code className="block text-sm font-mono text-black dark:text-white mb-2 break-all">
                {sig}
              </code>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
}
