"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const softRevealVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={reduceMotion ? softRevealVariants : revealVariants}
      transition={reduceMotion ? { duration: 0.2, delay } : { delay }}
    >
      {children}
    </motion.section>
  );
}

export function StaggeredGrid({
  children,
  className,
  itemClassName,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: {
          transition: reduceMotion ? {} : { staggerChildren: 0.08 },
        },
      }}
    >
      {items.map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={reduceMotion ? softRevealVariants : revealVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function OrganicGrid({
  children,
  className,
  itemClassName,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: reduceMotion ? {} : { staggerChildren: 0.055, delayChildren: 0.04 },
        },
      }}
    >
      {items.map((child, index) => {
        const x = ((index % 3) - 1) * 14;
        const y = index % 2 === 0 ? 18 : 30;
        const rotate = index % 2 === 0 ? -0.8 : 0.8;

        return (
          <motion.div
            key={index}
            className={itemClassName}
            variants={
              reduceMotion
                ? softRevealVariants
                : {
                    hidden: { opacity: 0, x, y, rotate },
                    visible: {
                      opacity: 1,
                      x: 0,
                      y: 0,
                      rotate: 0,
                      transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
                    },
                  }
            }
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function AnimatedCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("h-full", className)}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingCard({
  children,
  className,
  delay = 0,
  amplitude = 8,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  amplitude?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("h-full", className)}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: [0, -amplitude, 0] }
      }
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : {
              opacity: { duration: 0.35, delay },
              y: {
                duration: 4.5,
                ease: "easeInOut",
                repeat: Infinity,
                delay,
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}
