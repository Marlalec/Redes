import unittest

import numpy as np

from app.biometrics import average_embeddings, cosine_similarity, movement_span


class BiometricsTest(unittest.TestCase):
    def test_average_embeddings_returns_normalized_vector(self) -> None:
        result = average_embeddings(
            [
                np.asarray([1.0, 0.0, 0.0], dtype=np.float32),
                np.asarray([0.8, 0.2, 0.0], dtype=np.float32),
            ]
        )
        self.assertAlmostEqual(float(np.linalg.norm(result)), 1.0, places=5)

    def test_cosine_similarity_distinguishes_vectors(self) -> None:
        reference = np.asarray([1.0, 0.0], dtype=np.float32)
        self.assertAlmostEqual(cosine_similarity(reference, reference), 1.0, places=5)
        self.assertAlmostEqual(
            cosine_similarity(reference, np.asarray([0.0, 1.0], dtype=np.float32)),
            0.0,
            places=5,
        )

    def test_movement_span_uses_extremes(self) -> None:
        self.assertAlmostEqual(movement_span([-0.10, 0.02, 0.14]), 0.24)


if __name__ == "__main__":
    unittest.main()
