#![no_std]
use ethnum::u256;

pub struct Bn254;

/// Affine point representation (x, y) on the BN254 curve
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AffinePoint {
    pub x: u256,
    pub y: u256,
}

/// Jacobian point representation (X, Y, Z) on the BN254 curve
/// Affine coordinates (x, y) are related by: x = X/Z², y = Y/Z³
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct JacobianPoint {
    pub x: u256,
    pub y: u256,
    pub z: u256,
}

impl Bn254 {
    pub const BASE_MODULUS: ethnum::u256 = ethnum::u256::from_words(
        0x30644e72e131a029b85045b68181585d_u128, // high 128 bits (first 16 bytes)
        0x97816a916871ca8d3c208c16d87cfd47_u128, // low 128 bits  (last 16 bytes)
    );

    // pub const BASE_MODULUS: u256 = u256::from_words(
    //     0x30644e72e131a029b85045b68181585d,
    //     0x97816a916871ca8d3c208c16d87cfd47,
    // );

    pub fn is_valid_scalar(val: u256) -> bool {
        val < Self::BASE_MODULUS
    }

    pub fn add(a: u256, b: u256) -> u256 {
        let (sum, overflow) = a.overflowing_add(b);
        if overflow || sum >= Self::BASE_MODULUS {
            sum.wrapping_sub(Self::BASE_MODULUS)
        } else {
            sum
        }
    }

    /// Modular Multiplication: (a * b) % BASE_MODULUS
    /// Implements manual 512-bit long multiplication to bypass library limitations.
    pub fn mul(a: u256, b: u256) -> u256 {
        if a == 0 || b == 0 {
            return u256::from(0u8);
        }

        // Split a and b into 128-bit halves
        let a_low = u256::from(a.as_u128());
        let a_high = a >> 128;
        let b_low = u256::from(b.as_u128());
        let b_high = b >> 128;

        // Schoolbook multiplication (a_hi*2^128 + a_lo) * (b_hi*2^128 + b_lo)
        // This yields 4 partial products
        let p0 = a_low * b_low;
        let p1 = a_low * b_high;
        let p2 = a_high * b_low;
        let p3 = a_high * b_high;

        // Perform modular reduction on each partial product stage
        // to keep everything within 256-bit bounds.
        let mut res = p0 % Self::BASE_MODULUS;

        // Handle p1 and p2 (shifted by 128 bits)
        let mut p1_p2 = p1 % Self::BASE_MODULUS;
        p1_p2 = Self::add(p1_p2, p2 % Self::BASE_MODULUS);
        for _ in 0..128 {
            p1_p2 = Self::add(p1_p2, p1_p2); // Modular doubling
        }
        res = Self::add(res, p1_p2);

        // Handle p3 (shifted by 256 bits)
        let mut p3_red = p3 % Self::BASE_MODULUS;
        for _ in 0..256 {
            p3_red = Self::add(p3_red, p3_red); // Modular doubling
        }
        res = Self::add(res, p3_red);

        res
    }
    pub fn pow(mut base: u256, mut exp: u256) -> u256 {
        let mut res = u256::from(1u8);
        while exp > 0 {
            if exp % 2 == 1 {
                res = Self::mul(res, base);
            }
            base = Self::mul(base, base);
            exp /= 2;
        }
        res
    }

    pub fn invert(a: u256) -> u256 {
        if a == 0 {
            return u256::from(0u8);
        }
        let exponent = Self::BASE_MODULUS - u256::from(2u8);
        Self::pow(a, exponent)
    }

    pub fn is_valid_g1(x: u256, y: u256) -> bool {
        if x == 0 && y == 0 {
            return false;
        }
        if x >= Self::BASE_MODULUS || y >= Self::BASE_MODULUS {
            return false;
        }

        let y_sq = Self::mul(y, y);
        let x_sq = Self::mul(x, x);
        let x_cb = Self::mul(x_sq, x);
        let rhs = Self::add(x_cb, u256::from(3u8));

        y_sq == rhs
    }

    /// Convert Jacobian coordinates (X, Y, Z) to Affine coordinates (x, y)
    /// 
    /// # Arguments
    /// * `point` - A JacobianPoint with coordinates (X, Y, Z)
    /// 
    /// # Returns
    /// * `Some(AffinePoint)` - The affine coordinates (x, y) where x = X/Z² and y = Y/Z³
    /// * `None` - If Z = 0 (point at infinity)
    /// 
    /// # Mathematical Details
    /// Given Jacobian coordinates (X, Y, Z), the affine coordinates are:
    ///   x = X · Z⁻² mod p
    ///   y = Y · Z⁻³ mod p
    /// 
    /// We compute Z⁻¹ once using Fermat inversion, then derive:
    ///   Z⁻² = (Z⁻¹)²
    ///   Z⁻³ = Z⁻¹ · Z⁻²
    pub fn jacobian_to_affine(point: &JacobianPoint) -> Option<AffinePoint> {
        // Guard: Z = 0 represents the point at infinity
        if point.z == u256::from(0u8) {
            return None;
        }

        // Compute Z⁻¹ using Fermat's little theorem: Z⁻¹ = Z^(p-2) mod p
        let z_inv = Self::invert(point.z);

        // Compute Z⁻² = (Z⁻¹)²
        let z_inv_sq = Self::mul(z_inv, z_inv);

        // Compute Z⁻³ = Z⁻¹ · Z⁻²
        let z_inv_cb = Self::mul(z_inv, z_inv_sq);

        // Compute affine coordinates
        // x = X · Z⁻² mod p
        let x = Self::mul(point.x, z_inv_sq);

        // y = Y · Z⁻³ mod p
        let y = Self::mul(point.y, z_inv_cb);

        Some(AffinePoint { x, y })
    }

    /// Create a Jacobian point from affine coordinates
    /// 
    /// # Arguments
    /// * `x` - The x-coordinate in affine space
    /// * `y` - The y-coordinate in affine space
    /// 
    /// # Returns
    /// * `JacobianPoint` - The point in Jacobian coordinates with Z = 1
    pub fn affine_to_jacobian(point: &AffinePoint) -> JacobianPoint {
        JacobianPoint {
            x: point.x,
            y: point.y,
            z: u256::from(1u8),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jacobian_to_affine_normal_point() {
        // Test with a known point on the BN254 curve
        // Generator point G = (1, 2) in affine coordinates
        let affine_g = AffinePoint {
            x: u256::from(1u8),
            y: u256::from(2u8),
        };

        // Convert to Jacobian with Z = 1
        let jacobian_g = Bn254::affine_to_jacobian(&affine_g);

        // Convert back to affine
        let result = Bn254::jacobian_to_affine(&jacobian_g);

        // Should succeed and match original
        assert!(result.is_some());
        let converted = result.unwrap();
        assert_eq!(converted.x, affine_g.x);
        assert_eq!(converted.y, affine_g.y);
    }

    #[test]
    fn test_jacobian_to_affine_with_scaled_z() {
        // Test with a point where Z != 1
        // Use generator point G = (1, 2)
        let affine_g = AffinePoint {
            x: u256::from(1u8),
            y: u256::from(2u8),
        };

        // Create Jacobian point with Z = 2
        // This represents the same affine point (1, 2)
        let jacobian_scaled = JacobianPoint {
            x: Bn254::mul(affine_g.x, Bn254::mul(u256::from(2u8), u256::from(2u8))), // X = x * Z²
            y: Bn254::mul(affine_g.y, Bn254::mul(u256::from(2u8), Bn254::mul(u256::from(2u8), u256::from(2u8)))), // Y = y * Z³
            z: u256::from(2u8),
        };

        // Convert to affine
        let result = Bn254::jacobian_to_affine(&jacobian_scaled);

        // Should succeed and match original affine point
        assert!(result.is_some());
        let converted = result.unwrap();
        assert_eq!(converted.x, affine_g.x);
        assert_eq!(converted.y, affine_g.y);
    }

    #[test]
    fn test_jacobian_to_affine_identity_point() {
        // Test with Z = 0 (point at infinity)
        let jacobian_identity = JacobianPoint {
            x: u256::from(0u8),
            y: u256::from(0u8),
            z: u256::from(0u8),
        };

        // Convert to affine
        let result = Bn254::jacobian_to_affine(&jacobian_identity);

        // Should return None for point at infinity
        assert!(result.is_none());
    }

    #[test]
    fn test_jacobian_to_affine_round_trip() {
        // Test round-trip conversion: affine -> jacobian -> affine
        // Use a valid point on the BN254 curve
        let original_affine = AffinePoint {
            x: u256::from(1u8),
            y: u256::from(2u8),
        };

        // Verify the point is on the curve
        assert!(Bn254::is_valid_g1(original_affine.x, original_affine.y));

        // Convert to Jacobian
        let jacobian = Bn254::affine_to_jacobian(&original_affine);

        // Convert back to affine
        let result = Bn254::jacobian_to_affine(&jacobian);
        assert!(result.is_some());
        let round_trip_affine = result.unwrap();

        // Verify the point is still on the curve
        assert!(Bn254::is_valid_g1(round_trip_affine.x, round_trip_affine.y));

        // Verify coordinates match
        assert_eq!(round_trip_affine.x, original_affine.x);
        assert_eq!(round_trip_affine.y, original_affine.y);
    }

    #[test]
    fn test_jacobian_to_affine_multiple_z_values() {
        // Test that different Z values represent the same affine point
        let affine_point = AffinePoint {
            x: u256::from(1u8),
            y: u256::from(2u8),
        };

        // Test with Z = 1, 2, 3, 5
        let z_values = [1u8, 2, 3, 5];

        for &z_val in z_values.iter() {
            let z = u256::from(z_val);
            let jacobian = JacobianPoint {
                x: Bn254::mul(affine_point.x, Bn254::mul(z, z)), // X = x * Z²
                y: Bn254::mul(affine_point.y, Bn254::mul(z, Bn254::mul(z, z))), // Y = y * Z³
                z,
            };

            let result = Bn254::jacobian_to_affine(&jacobian);
            assert!(result.is_some());
            let converted = result.unwrap();
            assert_eq!(converted.x, affine_point.x);
            assert_eq!(converted.y, affine_point.y);
        }
    }
}
