import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const [animationData, setAnimationData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/Assets/Racooon-404.json") 
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  return (
    <motion.div
      initial={{
        background: "linear-gradient(to right, #ffe4ec, #fffaf5, #ffe4b5)",
      }}
      animate={{
        background: [
          "linear-gradient(to right, #ffe4ec, #fffaf5, #ffe4b5)", // light pink → white → light orange
          "linear-gradient(to right, #ffd6d6, #ffffff, #ffebcc)", // soft blush → white → peach
          "linear-gradient(to right, #ffe0f0, #fffdf8, #ffe0b2)", // pastel pink → ivory → soft orange
          "linear-gradient(to right, #ffe4ec, #fffaf5, #ffe4b5)",
        ],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="flex flex-col items-center justify-center min-h-screen px-4 text-gray-900 overflow-hidden"
    >
      {/* Animation */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-md"
      >
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            className="w-full h-auto"
          />
        )}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="text-4xl md:text-5xl font-extrabold mt-4 text-pink-600 drop-shadow-lg text-center"
      >
        404 - Page Not Found
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="mt-3 text-base md:text-lg text-gray-700 text-center"
      >
        Oops! The page you are looking for doesn’t exist.
      </motion.p>

      {/* Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300"
      >
        Back to Home
      </motion.button>
    </motion.div>
  );
};

export default NotFoundPage;
