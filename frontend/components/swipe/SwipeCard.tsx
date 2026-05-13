"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import type { NearbyStrangerEntry } from "@/lib/types";
import { formatDistance } from "@/lib/utils";

interface Props {
  stranger: NearbyStrangerEntry;
  isTop: boolean;
  stackIndex: number;
  onSwipeRight: (s: NearbyStrangerEntry) => void;
  onSwipeLeft: (s: NearbyStrangerEntry) => void;
}

const THRESHOLD = 100;

export function SwipeCard({ stranger, isTop, stackIndex, onSwipeRight, onSwipeLeft }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
  const controls = useAnimation();

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD) {
      await controls.start({ x: 700, opacity: 0, transition: { duration: 0.25 } });
      onSwipeRight(stranger);
    } else if (info.offset.x < -THRESHOLD) {
      await controls.start({ x: -700, opacity: 0, transition: { duration: 0.25 } });
      onSwipeLeft(stranger);
    } else {
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl select-none"
      style={{
        x,
        rotate,
        zIndex: 10 - stackIndex,
        scale: 1 - stackIndex * 0.04,
        y: stackIndex * 10,
        cursor: isTop ? "grab" : "default",
      }}
      animate={controls}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* Background image */}
      <div className="relative w-full h-full bg-surface">
        {stranger.profilePictureUrl ? (
          <Image
            src={stranger.profilePictureUrl}
            alt={stranger.displayName}
            fill
            sizes="480px"
            className="object-cover pointer-events-none"
            unoptimized
            priority={isTop}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-8xl">👤</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-6 top-10 rotate-[-20deg] rounded-lg border-4 border-success px-3 py-1 text-2xl font-black text-success"
        >
          LIKE
        </motion.div>

        {/* NOPE stamp */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute right-6 top-10 rotate-[20deg] rounded-lg border-4 border-danger px-3 py-1 text-2xl font-black text-danger"
        >
          NOPE
        </motion.div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {stranger.displayName}
          </h2>
          <p className="mt-1 text-white/70">{formatDistance(stranger.distanceMiles)}</p>
        </div>
      </div>
    </motion.div>
  );
}
